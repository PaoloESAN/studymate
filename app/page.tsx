// app/page.tsx - Redirección inicial hacia /dashboard o /login
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}
