import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function DashboardClient({ shopping, todos, finances, onRefresh }: { shopping: any[], todos: any[], finances: any[], onRefresh: () => void }) {
  const navigate = useNavigate();

  const missingItems = shopping.filter((i: any) => !i.checked);
  const openTodos = todos.filter((i: any) => !i.completed);
  const totalFinances = finances.reduce((sum: number, exp: any) => sum + exp.amount, 0);

  const availableMoods = [
    { name: 'Chill', icon: 'spa' },
    { name: 'Focus', icon: 'menu_book' },
    { name: 'Cooking', icon: 'restaurant' },
    { name: 'Cleaning', icon: 'cleaning_services' },
    { name: 'Rest', icon: 'bedtime' }
  ];

  const [residentMoods, setResidentMoods] = useState<Record<string, string>>({
    'Sarah': 'Cleaning',
    'Marco': 'Focus',
    'Lila': 'Chill'
  });

  // Convert residents to state to allow interactive toggling
  const [allResidents, setAllResidents] = useState([
    { name: 'Sarah', home: true, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvkAXNPBE9QsxvQpPuUFfuhl6M4N76VlzK32Vam0_PlNbMCAdXpRbi-7tjBytQRpavk5ZkHFuRE-FwXeZ-8xu3GXbqG1zSdYwvTumc4Y0Jzcl-qP3ZGiPRRy_I2h2nV5wf7sT9upJ8qlVPyi1IvwNJ6p374_YzFyBZRF1yL1y81H3xsKvkFE8gr8TflB4-a3PhvRZMRFq3PdDy_7A_qbp_qAF13CMKouPxxvjpylNbK41fVkebcAScbXxLGgq147rMW_uMYGdmwsvN' },
    { name: 'Marco', home: false, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvbHRoG9cZyWBnineFNvdGIvxT1afQdInASiVo-7s5yR_Fcn31VudpDzVIVspf-hYK5BVu2drCqTv536luZxxIT_rzIrfZNAxoM7aRe0oxf4maidnry9oqQsUFeYvhwgPiudDeMZvZm63L2-yVPn34hvk4QWiWqieLCQaGUvjv4i9iBBse9zXuqP6KSDI0I80cUErZkfEl3ry7IsaUbna1-JcEHbJamC063kGgVgBSLoOilNLUJtpvW74N9pOYGll8J9sfyNkbckUU' },
    { name: 'Lila', home: true, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLbhLHz21hs0e11MO0LJup2GjQInmpw1mS2ZMtX5VIDknvPvyTWgHbF0eHEcgpkzHu71DyCRwNEP82Ffsu4rQoLyISh2Qj3cElf8RGM8k-FL6VODmg90OadXJgwVrvo74K9dLdF0_BimLJa_DM48DtwpHppN6a_-MJyHY1ltDT9UgTziK4sWSh9rdhk5ch9YzvEVKZnb7w4OdDoiDignkizc8B0H3k5WzLO6YLGmEsLsUDojXKs3vFChYB8N807VktZbptwXCtHb0Y' },
  ]);

  const toggleLilaHome = () => {
    setAllResidents(prev => prev.map(res => 
      res.name === 'Lila' ? { ...res, home: !res.home } : res
    ));
  };

  const isLilaHome = allResidents.find(r => r.name === 'Lila')?.home;

  return (
    <div className="animate-fade-in w-full space-y-12 pb-20">
      
      {/* Vibe / Hero Section */}
      <section className="space-y-8 animate-fade-in py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-sage-soft flex items-center justify-center text-primary border border-primary/10 shadow-sm">
            <span className="material-symbols-outlined font-black">temple_buddhist</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Sanctuary Vibe</span>
        </div>
        
        <div>
          <h1 className="font-headline text-5xl md:text-7xl font-semibold text-on-surface tracking-tighter leading-[1.05] mb-4">
            Willkommen Zuhause, <br/>
            <span className="text-primary italic font-light text-4xl md:text-6xl">Genieße die Ruhe</span>
          </h1>
          <p className="text-on-surface-variant font-medium text-lg md:text-xl leading-relaxed opacity-70 max-w-lg">
            Dein Rückzugsort in der WG. Alles ist im Fluss, alle Aufgaben sind verteilt und die Stimmung ist Zen.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-4 -mx-4 no-scrollbar scroll-smooth items-center">
          {availableMoods.map((moodObj) => {
            const isActive = residentMoods['Lila'] === moodObj.name;
            return (
              <button 
                key={moodObj.name} 
                onClick={() => setResidentMoods({...residentMoods, 'Lila': moodObj.name})}
                className={`flex-shrink-0 px-8 py-4 rounded-full font-headline font-bold flex items-center gap-2 transition-all h-[60px] ${isActive ? 'bg-primary text-white chill-shadow scale-105' : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-stone-100'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{moodObj.icon}</span>
                {moodObj.name}
              </button>
            );
          })}

          <div className="w-[1px] h-8 bg-outline-variant/30 flex-shrink-0 mx-2" />

          {/* Apple-Style Home Switch Integrated - Fixed layout shifts */}
          <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-outline-variant/30 px-6 py-3 rounded-full shadow-sm transition-all hover:bg-stone-50 h-[60px]">
             <div className="flex flex-col -space-y-1 w-20">
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">Status</span>
                <span className="text-[12px] font-bold text-on-surface whitespace-nowrap">{isLilaHome ? 'Zuhause' : 'Unterwegs'}</span>
             </div>
             <button 
                onClick={toggleLilaHome}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${isLilaHome ? 'bg-primary' : 'bg-stone-300'}`}
             >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 transform ${isLilaHome ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Grid Left */}
        <div className="space-y-8">
          {/* Who's Home Card */}
          <div className="glass-panel stagger-1">
            <h3 className="font-headline text-xl font-semibold mb-8 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary zen-pulse"></span>
              Wer ist Zuhause
            </h3>
            <div className="flex gap-8">
              {allResidents.map((res, i) => {
                const moodName = residentMoods[res.name] || 'Chill';
                const moodObj = availableMoods.find(m => m.name === moodName) || availableMoods[0];
                return (
                  <div key={res.name} className={`flex flex-col items-center gap-3 transition-all duration-700 stagger-${i+2} ${res.home ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
                    <div className={`w-20 h-20 rounded-full p-1 border-2 transition-all ${res.home ? 'border-primary/60 shadow-lg shadow-primary/5' : 'border-transparent'}`}>
                      <img alt={res.name} className="w-full h-full rounded-full object-cover bg-stone-100" src={res.img}/>
                    </div>
                    <div className="text-center space-y-1">
                      <span className={`font-headline text-[12px] font-bold uppercase tracking-widest ${res.home ? 'text-primary' : 'text-on-surface-variant'}`}>{res.name}</span>
                      <div className="flex items-center justify-center gap-1.5 opacity-60">
                        <span className="material-symbols-outlined text-[14px]">{moodObj.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{moodObj.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
 
          {/* Blackboard */}
          <section className="mt-4 stagger-4 transition-all">
            <div className="bg-slate-900 rounded-[2rem] p-8 pb-10 border-[6px] border-stone-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10 border-b-2 border-slate-700/50 pb-4">
                <h3 className="font-headline text-2xl font-black text-slate-100 flex items-center gap-3 italic">
                  <span className="material-symbols-outlined text-slate-300">edit_note</span>
                  Blackboard
                </h3>
                <span className="text-[10px] font-headline text-slate-400 uppercase tracking-[0.2em] font-bold">Latest Notes</span>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-700/50 shadow-md">
                    <img alt="Sarah" src={allResidents[0].img}/>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-relaxed text-slate-200 italic">"Yo! Just finished deep cleaning the fridge. 🧊 Don't forget my reward beers! 🍻"</p>
                    <p className="text-[10px] font-headline font-bold text-slate-500 uppercase">Sarah • 12m ago</p>
                  </div>
                </div>
 
                <div className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-700/50 shadow-md">
                    <img alt="Marco" src={allResidents[1].img}/>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-relaxed text-slate-200 italic">"Need the kitchen table for a study group tonight from 18:00 to 20:00! Thanks! 📚"</p>
                    <p className="text-[10px] font-headline font-bold text-slate-500 uppercase">Marco • 2h ago</p>
                  </div>
                </div>
 
                {finances.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-700/50 border-dashed">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-300 text-[18px]">payments</span>
                      <p className="text-[13px] font-medium text-slate-200 italic"><span className="text-white font-bold">{finances[0].paidBy}</span> paid for <span className="underline decoration-slate-600 underline-offset-4">{finances[0].description}</span></p>
                      <span className="ml-auto text-[10px] font-headline text-slate-500 font-bold uppercase">Recent</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
 
        {/* Status Grid Right */}
        <div className="space-y-8">
          {/* Vibe Leaders */}
          <div className="bg-sage-soft/20 rounded-[3rem] p-8 border border-sage-soft/30">
            <h3 className="font-headline text-xl font-black mb-1">Vibe Leaders</h3>
            <p className="font-headline text-on-surface-variant text-[10px] uppercase tracking-widest font-black mb-8 opacity-60">Chore Streak Rewards</p>
            
            <div className="space-y-4">
              {[
                { name: 'Lila S.', task: 'Trash Master + Kitchen', pts: '2.4k', rank: '01' },
                { name: 'Felix T.', task: 'Dishwash Hero', pts: '1.8k', rank: '02' }
              ].map((leader, i) => (
                <div key={leader.name} className={`flex items-center justify-between p-5 rounded-3xl transition-all stagger-${i+3} ${i === 0 ? 'bg-white shadow-lg shadow-sage-soft/20' : 'bg-white/40'}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-headline text-2xl font-black italic text-primary/20">{leader.rank}</span>
                    <div>
                      <p className="font-black text-sm text-on-surface">{leader.name}</p>
                      <p className="text-[11px] font-medium text-on-surface-variant">{leader.task}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-headline font-extrabold text-lg">{leader.pts}</span>
                    <p className="text-[9px] uppercase font-headline font-black text-on-surface-variant">Pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <section className="grid grid-cols-2 gap-4">
            <div onClick={() => navigate('/?tab=shopping')} className="p-6 rounded-[2rem] bg-white border border-outline-variant/30 hover:bg-sage-soft/10 transition-all group cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">shopping_basket</span>
              <p className="font-headline font-black text-lg">Add Stock</p>
              <p className="text-[10px] text-on-surface-variant font-bold opacity-60">Milk, Eggs, Vibes...</p>
            </div>
            <div onClick={() => navigate('/?tab=todos')} className="p-6 rounded-[2rem] bg-white border border-outline-variant/30 hover:bg-sage-soft/10 transition-all group cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">task_alt</span>
              <p className="font-headline font-black text-lg">Did Task</p>
              <p className="text-[10px] text-on-surface-variant font-bold opacity-60">Log your points</p>
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
