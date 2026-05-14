export interface User {
  id: string;
  name: string;
  email?: string;
  pin: string;
  role: 'admin' | 'teacher' | 'collector';
  active: boolean;
  createdAt: Date;
}

export interface Child {
  id: string;
  name: string;
  qrId: string;
  balance: number;
  age: number;
  ageGroup: '5-6' | '7-8' | '9-10' | '11-12';
  createdAt: Date;
}

export interface Transaction {
  id: string;
  childId: string;
  childName: string;
  amount: number;
  type: 'deposit' | 'charge';
  collectorId: string;
  collectorName: string;
  timestamp?: Date;
}
