export interface CustomerData {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
  repeatedPassword: string;
}

export function createCustomer(region: string, testId: string): CustomerData {
  const timestamp = Date.now().toString(36);
  const shortId = testId.slice(-8);
  const username = `test_${region}_${timestamp}_${shortId}`;

  return {
    firstName: "Test",
    lastName: "Customer",
    street: "123 Test Street",
    city: "Testville",
    state: "TS",
    zipCode: "12345",
    phoneNumber: "555-0100",
    ssn: "123-45-6789",
    username,
    password: "TestPass123!",
    repeatedPassword: "TestPass123!",
  };
}
