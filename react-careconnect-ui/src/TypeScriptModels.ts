export type Patient = {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  phone: string;
  insurance: string;
  memberId: string;
  ownerSub: string;
};
export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  specialty: string;
  startsAt: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  visitType: string;
};
export type Provider = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
};
export type Verification = {
  id: string;
  patientId: string;
  memberId: string;
  payer: string;
  status: string;
  source: string;
  reference: string;
  copay: number;
  checkedAt: string;
};
export type Notice = {
  id: string;
  message: string;
  deliveryStatus: string;
  createdAt: string;
};
export type Audit = {
  id: string;
  actor: string;
  action: string;
  aggregateId: string;
  createdAt: string;
};
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
};
export type Booking = Pick<
  Appointment,
  | "patientId"
  | "providerId"
  | "providerName"
  | "specialty"
  | "startsAt"
  | "visitType"
>;
