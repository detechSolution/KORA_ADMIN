export type Instructor = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  assignedSession: number;
  upcomingSessions: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    fullName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
  };
  updatedBy: {
    fullName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
  };
};
