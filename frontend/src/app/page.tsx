import { ShoppingCart, CheckSquare, Wallet } from 'lucide-react';

export default async function Home() {
  // Fetch data as a Server Component directly from the Express backend
  const [shoppingRes, todosRes, financesRes] = await Promise.all([
    fetch('http://localhost:3000/api/shopping', { cache: 'no-store' }),
    fetch('http://localhost:3000/api/todos', { cache: 'no-store' }),
    fetch('http://localhost:3000/api/finances', { cache: 'no-store' })
  ]).catch(() => [null, null, null]);

  let shopping = [];
  let todos = [];
  let finances = [];

  if (shoppingRes && todosRes && financesRes) {
    try {
      shopping = await shoppingRes.json();
      todos = await todosRes.json();
      finances = await financesRes.json();
    } catch (e) {
      console.error("Failed to parse JSON from backend", e);
    }
  }

  const missingItemsCount = shopping.filter((i: any) => !i.checked).length;
  const nextTodo = todos.find((i: any) => !i.completed);
  
  // Finance logic based on previous dashboard text
  const financesStatusText = "Dieser Monat sieht gut aus! Keine offenen Schulden ermittelt.";

  return (
    <div className="flex flex-col min-h-screen pt-16 px-6 max-w-5xl mx-auto w-full animate-fade-in">
      <header className="mb-12">
        <h1 className="text-[2.5rem] font-[800] mb-2 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent inline-block tracking-tight m-0">
          Willkommen Zuhause! 🏠
        </h1>
        <p className="text-slate-600 text-lg">Hier ist die aktuelle Übersicht für eure WG.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="glass-panel p-8 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-blue-500">
            <ShoppingCart size={32} />
            <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Einkauf</h2>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-sm">
            {missingItemsCount === 0 
              ? "Alles besorgt!"
              : `${missingItemsCount} Artikel auf der Einkaufsliste fehlen noch.`}
          </p>
          <a href="/shopping" className="btn btn-secondary mt-auto">Zur Liste</a>
        </div>

        <div className="glass-panel p-8 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-violet-500">
            <CheckSquare size={32} />
            <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Putzplan</h2>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-sm">
            {nextTodo 
              ? `${nextTodo.assignee} ist diese Woche mit der "${nextTodo.title}" dran.`
              : "Keine offenen Aufgaben für diese Woche."}
          </p>
          <a href="/todos" className="btn btn-secondary mt-auto">Zum Plan</a>
        </div>

        <div className="glass-panel p-8 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-emerald-500">
            <Wallet size={32} />
            <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Finanzen</h2>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-sm">{financesStatusText}</p>
          <a href="/finance" className="btn btn-secondary mt-auto">Zum Finanzcheck</a>
        </div>
        
      </div>
    </div>
  );
}
