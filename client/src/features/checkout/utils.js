/** The address the checkout treats as selected: explicit choice → default → first. */
export const resolveSelectedAddress = (addresses = [], addressId) =>
  addresses.find((a) => a._id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
