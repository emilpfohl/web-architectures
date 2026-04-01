import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function DashboardClient({ shopping, todos, finances, onRefresh }: { shopping: any[], todos: any[], finances: any[], onRefresh: () => void }) {
  const navigate = useNavigate();

  const missingItems = shopping.filter((i: any) => !i.checked);
  const openTodos = todos.filter((i: any) => !i.completed);
  const totalFinances = finances.reduce((sum: number, exp: any) => sum + exp.amount, 0);

  // Mock data for new sections based on Stitch design
  const residents = [
    { name: 'Sarah', home: true, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvkAXNPBE9QsxvQpPuUFfuhl6M4N76VlzK32Vam0_PlNbMCAdXpRbi-7tjBytQRpavk5ZkHFuRE-FwXeZ-8xu3GXbqG1zSdYwvTumc4Y0Jzcl-qP3ZGiPRRy_I2h2nV5wf7sT9upJ8qlVPyi1IvwNJ6p374_YzFyBZRF1yL1y81H3xsKvkFE8gr8TflB4-a3PhvRZMRFq3PdDy_7A_qbp_qAF13CMKouPxxvjpylNbK41fVkebcAScbXxLGgq147rMW_uMYGdmwsvN' },
    { name: 'Marco', home: false, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvbHRoG9cZyWBnineFNvdGIvxT1afQdInASiVo-7s5yR_Fcn31VudpDzVIVspf-hYK5BVu2drCqTv536luZxxIT_rzIrfZNAxoM7aRe0oxf4maidnry9oqQsUFeYvhwgPiudDeMZvZm63L2-yVPn34hvk4QWiWqieLCQaGUvjv4i9iBBse9zXuqP6KSDI0I80cUErZkfEl3ry7IsaUbna1-JcEHbJamC063kGgVgBSLoOilNLUJtpvW74N9pOYGll8J9sfyNkbckUU' },
    { name: 'Lila', home: true, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLbhLHz21hs0e11MO0LJup2GjQInmpw1mS2ZMtX5VIDknvPvyTWgHbF0eHEcgpkzHu71DyCRwNEP82Ffsu4rQoLyISh2Qj3cElf8RGM8k-FL6VODmg90OadXJgwVrvo74K9dLdF0_BimLJa_DM48DtwpHppN6a_-MJyHY1ltDT9UgTziK4sWSh9rdhk5ch9YzvEVKZnb7w4OdDoiDignkizc8B0H3k5WzLO6YLGmEsLsUDojXKs3vFChYB8N807VktZbptwXCtHb0Y' },
  ];

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

        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth">
          {['Chill', 'Focus', 'Cooking'].map((vibe, idx) => (
            <button key={vibe} className={`flex-shrink-0 px-8 py-4 rounded-full font-headline font-bold flex items-center gap-2 transition-all ${idx === 0 ? 'bg-primary text-white chill-shadow' : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-stone-100'}`}>
              <span className="material-symbols-outlined text-[18px]">{idx === 0 ? 'spa' : (idx === 1 ? 'menu_book' : 'restaurant')}</span>
              {vibe}
            </button>
          ))}
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
              {residents.map((res, i) => (
                <div key={res.name} className={`flex flex-col items-center gap-3 transition-all duration-700 stagger-${i+2} ${res.home ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
                  <div className={`w-20 h-20 rounded-full p-1 border-2 transition-all ${res.home ? 'border-primary/60 shadow-lg shadow-primary/5' : 'border-transparent'}`}>
                    <img alt={res.name} className="w-full h-full rounded-full object-cover bg-stone-100" src={res.img}/>
                  </div>
                  <span className={`font-headline text-[12px] font-bold uppercase tracking-widest ${res.home ? 'text-primary' : 'text-on-surface-variant'}`}>{res.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <section className="space-y-6">
            <h3 className="font-headline text-xl font-bold flex items-center justify-between px-2">
              Live Feed
              <span className="text-[10px] font-headline text-primary uppercase tracking-[0.2em] font-bold">3 Updates</span>
            </h3>
            <div className="space-y-8">
              <div className="flex gap-4 stagger-4 transition-all">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                  <img alt="Sarah" src={residents[0].img}/>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-white p-6 rounded-[2.5rem] rounded-tl-none border border-outline-variant/30 shadow-sm">
                    <p className="text-sm font-bold leading-relaxed text-on-surface">Yo! Just finished deep cleaning the fridge. 🧊 Don't forget my reward beers! 🍻</p>
                  </div>
                  <p className="text-[10px] font-headline font-black text-on-surface-variant uppercase ml-2">Sarah • 12m ago</p>
                </div>
              </div>

              {finances.length > 0 && (
                <div className="flex items-center gap-4 py-4 px-8 bg-primary/5 rounded-full border border-primary/10 mx-2 stagger-5 transition-all">
                  <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
                  <p className="text-[13px] font-bold"><span className="text-primary">{finances[0].paidBy}</span> paid for <span className="italic">{finances[0].description}</span></p>
                  <span className="ml-auto text-[10px] text-on-surface-variant font-black opacity-40">Recent</span>
                </div>
              )}
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
