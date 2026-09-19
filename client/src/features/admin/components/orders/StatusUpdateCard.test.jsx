import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { StatusUpdateCard } from './StatusUpdateCard';

vi.mock('@/features/admin/api/orders', () => ({
  ordersApi: {
    updateStatus: vi.fn(() => Promise.resolve({})),
    cancel: vi.fn(() => Promise.resolve({})),
  },
}));

const { ordersApi } = await import('@/features/admin/api/orders');

function renderCard(props) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StatusUpdateCard orderId="o1" currentStatus="packed" {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StatusUpdateCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('only offers the allowed transitions', () => {
    renderCard({ allowedTransitions: ['shipped', 'cancelled'] });
    const select = screen.getByLabelText(/new status/i);
    const options = within(select).getAllByRole('option');
    expect(options.map((o) => o.value)).toEqual(['', 'shipped', 'cancelled']);
    expect(options.map((o) => o.textContent)).toEqual(['Select status…', 'Shipped', 'Cancelled']);
  });

  it('shows tracking fields only when "shipped" is selected', async () => {
    const user = userEvent.setup();
    renderCard({ allowedTransitions: ['shipped', 'cancelled'] });
    const select = screen.getByLabelText(/new status/i);

    expect(screen.queryByLabelText(/carrier/i)).not.toBeInTheDocument();

    await user.selectOptions(select, 'shipped');
    expect(screen.getByLabelText(/carrier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tracking number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tracking url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estimated delivery/i)).toBeInTheDocument();

    await user.selectOptions(select, 'cancelled');
    expect(screen.queryByLabelText(/carrier/i)).not.toBeInTheDocument();
  });

  it('requires carrier and tracking number when shipping', async () => {
    const user = userEvent.setup();
    renderCard({ allowedTransitions: ['shipped'] });
    await user.selectOptions(screen.getByLabelText(/new status/i), 'shipped');
    await user.click(screen.getByRole('button', { name: /mark as shipped/i }));

    expect(await screen.findByText('Carrier is required')).toBeInTheDocument();
    expect(screen.getByText('Tracking number is required')).toBeInTheDocument();
    expect(ordersApi.updateStatus).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/carrier/i), 'Delhivery');
    await user.type(screen.getByLabelText(/tracking number/i), 'DL123');
    await user.click(screen.getByRole('button', { name: /mark as shipped/i }));

    await waitFor(() =>
      expect(ordersApi.updateStatus).toHaveBeenCalledWith('o1', {
        status: 'shipped',
        note: undefined,
        tracking: { carrier: 'Delhivery', trackingNumber: 'DL123', trackingUrl: '', estimatedDelivery: undefined },
      }),
    );
  });

  it('shows the final-state message when no transitions are allowed', () => {
    renderCard({ currentStatus: 'refunded', allowedTransitions: [] });
    expect(screen.getByText(/this order is in a final state/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
