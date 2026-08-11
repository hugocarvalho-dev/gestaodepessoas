'use client';

import { useParams } from 'next/navigation';
import EmployeeForm from '@/app/(dashboard)/employees/components/EmployeeForm';

export default function EditEmployee() {
  const params = useParams();
  const id = params.id as string;

  return <EmployeeForm employeeId={id} isEditing={true} />;
}
