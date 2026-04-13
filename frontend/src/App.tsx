import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabsNav } from './components/TabsNav';
import { DashboardClient } from './components/DashboardClient';
import { ShoppingClient } from './components/ShoppingClient';
import { TodoClient } from './components/TodoClient';
import { FinanceClient } from './components/FinanceClient';

function App() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [shopping, setShopping] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = () => setRefreshCounter(prev => prev + 1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const promises = [];
        
        if (currentTab === 'dashboard' || currentTab === 'shopping') {
          promises.push(
            fetch('/api/shopping?wgId=1')
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setShopping(d) : setShopping([]))
          );
          promises.push(
            fetch('/api/shopping/categories')
              .then(r => r.json())
              .then(d => setCategories(d || []))
          );
        }
        
        if (currentTab === 'dashboard' || currentTab === 'todos') {
          promises.push(
            fetch('/api/todos?wgId=1')
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setTodos(d) : setTodos([]))
          );
        }
        
        if (currentTab === 'dashboard' || currentTab === 'finance') {
          promises.push(
            fetch('/api/finances?wgId=1')
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setFinances(d) : setFinances([]))
          );
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentTab, refreshCounter]);

  return (
    <div className="font-body h-full flex flex-col bg-background">
      <div className="bg-flare" />
      <TabsNav />
      <main className="flex-1 p-6 md:p-16 lg:p-24 overflow-x-hidden animate-fade-in">
        <div className="w-full max-w-6xl mx-auto space-y-12">
          {loading && refreshCounter === 0 ? (
             <div className="flex items-center justify-center min-h-[400px]">
                <div className="material-symbols-outlined animate-spin text-primary/40 text-4xl">progress_activity</div>
             </div>
          ) : (
            <>
              {currentTab === 'dashboard' && <DashboardClient shopping={shopping} todos={todos} finances={finances} onRefresh={refresh} />}
              {currentTab === 'shopping' && <ShoppingClient initialItems={shopping} initialCategories={categories} onRefresh={refresh} />}
              {currentTab === 'todos' && <TodoClient initialTodos={todos} onRefresh={refresh} />}
              {currentTab === 'finance' && <FinanceClient initialExpenses={finances} onRefresh={refresh} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
