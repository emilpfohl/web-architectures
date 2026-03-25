import { ShoppingCart, CheckSquare, Wallet } from 'lucide-react';
import { TabsNav } from '@/components/TabsNav';
import { ShoppingClient } from '@/components/ShoppingClient';
import { TodoClient } from '@/components/TodoClient';
import { FinanceClient } from '@/components/FinanceClient';
import { DashboardClient } from '@/components/DashboardClient';

// Using searchParams to fetch different data depending on the tab directly in Server Component.
// This preserves the SSR without useEffect architecture exactly as requested.
export default async function Home({ searchParams }: { searchParams: { tab?: string } }) {
  // Await searchParams in Next 15
  const params = await searchParams;
  const currentTab = params.tab || 'dashboard';

  let shopping: any[] = [];
  let categories: string[] = [];
  let todos: any[] = [];
  let finances: any[] = [];

  // Parallel fetching, only fetching what is needed for current view
  const fetchPromises = [];
  
  if (currentTab === 'dashboard' || currentTab === 'shopping') {
    fetchPromises.push(
      fetch('http://localhost:3000/api/shopping', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { shopping = d; })
        .catch(() => null)
    );
    fetchPromises.push(
      fetch('http://localhost:3000/api/shopping/categories', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { categories = d || []; })
        .catch(() => null)
    );
  }
  
  if (currentTab === 'dashboard' || currentTab === 'todos') {
    fetchPromises.push(
      fetch('http://localhost:3000/api/todos', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { todos = d; })
        .catch(() => null)
    );
  }
  
  if (currentTab === 'dashboard' || currentTab === 'finance') {
    fetchPromises.push(
      fetch('http://localhost:3000/api/finances', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { finances = d; })
        .catch(() => null)
    );
  }

  await Promise.all(fetchPromises);

  return (
    <div className="flex flex-col min-h-screen pt-16 px-6 max-w-6xl mx-auto w-full animate-fade-in relative pb-20">
      <header className="mb-10 text-center md:text-left flex flex-col items-center md:items-start">
        <h1 className="text-[2.5rem] font-[800] mb-2 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent inline-block tracking-tight m-0">
          Willkommen Zuhause! 🏠
        </h1>
        <p className="text-slate-600 text-lg">Hier ist die aktuelle Übersicht für eure WG.</p>
      </header>

      <TabsNav currentTab={currentTab} />

      <main className="mt-6 flex justify-center w-full">
        {currentTab === 'dashboard' && <DashboardClient shopping={shopping} todos={todos} finances={finances} />}
        {currentTab === 'shopping' && <ShoppingClient initialItems={shopping} initialCategories={categories} />}
        {currentTab === 'todos' && <TodoClient initialTodos={todos} />}
        {currentTab === 'finance' && <FinanceClient initialExpenses={finances} />}
      </main>
    </div>
  );
}
