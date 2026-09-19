import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

vi.mock('@/services/apiClient', () => ({ http: {}, getErrorMessage: (e) => e?.message }));

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'price', header: 'Price', align: 'right', cell: (row) => `₹${row.price}` },
];

const rows = [
  { _id: 'a', name: 'Linen Shirt', price: 1299 },
  { _id: 'b', name: 'Canvas Tote', price: 799 },
];

describe('DataTable', () => {
  it('renders a captioned table with header and data rows', () => {
    render(<DataTable caption="Products" columns={columns} rows={rows} />);
    const table = screen.getByRole('table', { name: 'Products' });
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Linen Shirt' })).toBeInTheDocument();
    expect(within(table).getByText('₹799')).toBeInTheDocument();
    // header row + 2 data rows
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  it('shows skeleton rows while loading and hides data', () => {
    render(<DataTable caption="Products" columns={columns} rows={rows} loading skeletonRows={4} />);
    expect(screen.getAllByTestId('skeleton-row')).toHaveLength(4);
    expect(screen.queryByText('Linen Shirt')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the empty state when there are no rows', () => {
    render(<DataTable caption="Products" columns={columns} rows={[]} empty={{ title: 'No products yet', description: 'Add one' }} />);
    expect(screen.getByText('No products yet')).toBeInTheDocument();
    expect(screen.getByText('Add one')).toBeInTheDocument();
  });

  it('shows an error state with retry', () => {
    const onRetry = vi.fn();
    render(<DataTable caption="Products" columns={columns} rows={[]} error={{ message: 'Boom', status: 500 }} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('invokes onRowClick on click and Enter', () => {
    const onRowClick = vi.fn();
    render(<DataTable caption="Products" columns={columns} rows={rows} onRowClick={onRowClick} rowLabel={(r) => `Open ${r.name}`} />);
    fireEvent.click(screen.getByText('Canvas Tote'));
    expect(onRowClick).toHaveBeenLastCalledWith(rows[1]);
    fireEvent.keyDown(screen.getByRole('row', { name: 'Open Linen Shirt' }), { key: 'Enter' });
    expect(onRowClick).toHaveBeenLastCalledWith(rows[0]);
  });

  it('renders pagination summary', () => {
    render(
      <DataTable
        caption="Products"
        columns={columns}
        rows={rows}
        pagination={{ page: 2, limit: 2, total: 5, totalPages: 3 }}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText('3–4 of 5')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });
});
