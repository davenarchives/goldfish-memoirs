import { useState, useMemo } from 'react';

const CalendarView = ({ tasks }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { month, year, daysInMonth, firstDayOfMonth, prevMonthDays } = useMemo(() => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysIn = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday-start (0 = Mon, 6 = Sun)
        // firstDay: 0=Sun, 1=Mon...
        let adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const prevMonthDays = new Date(year, month, 0).getDate();

        return { month, year, daysInMonth: daysIn, firstDayOfMonth: adjustedFirstDay, prevMonthDays };
    }, [currentDate]);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    // Group tasks by date string (YYYY-MM-DD)
    const taskMap = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            if (!task.dueDate) return;
            const dateStr = task.dueDate.toISOString().split('T')[0];
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(task);
        });
        return map;
    }, [tasks]);

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const calendarGrid = [];

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        calendarGrid.push({ day: prevMonthDays - i, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarGrid.push({ day: i, currentMonth: true });
    }

    // Next month padding
    const remaining = 42 - calendarGrid.length; // 6 weeks total
    for (let i = 1; i <= remaining; i++) {
        calendarGrid.push({ day: i, currentMonth: false });
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden select-none">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-[#FBB03B] font-bold flex items-center gap-1 text-sm"
                >
                    <span className="text-lg">◀</span> {monthNames[(month + 11) % 12]}
                </button>
                <h2 className="text-xl font-bold text-[#1D264F]">
                    {monthNames[month]} {year}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-[#FBB03B] font-bold flex items-center gap-1 text-sm"
                >
                    {monthNames[(month + 1) % 12]} <span className="text-lg">▶</span>
                </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-gray-100">
                {daysOfWeek.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-[#1D264F] uppercase tracking-wider border-r border-gray-100 last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-collapse">
                {calendarGrid.map((cell, idx) => {
                    const dateObj = new Date(year, month, cell.day);
                    if (!cell.currentMonth) {
                        // Correct date for padding days
                        if (idx < firstDayOfMonth) {
                            dateObj.setMonth(month - 1);
                        } else {
                            dateObj.setMonth(month + 1);
                        }
                    }
                    const dateKey = dateObj.toISOString().split('T')[0];
                    const dayTasks = taskMap[dateKey] || [];
                    const today = isToday(cell.day) && cell.currentMonth;

                    return (
                        <div
                            key={idx}
                            className={`min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 relative group transition-colors flex flex-col items-start
                                ${cell.currentMonth ? 'bg-white' : 'bg-gray-50/30 text-gray-400'}
                                ${today ? 'bg-orange-50/30' : ''}
                            `}
                        >
                            <span className={`
                                w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-full mb-1
                                ${today ? 'bg-[#FBB03B] text-white' : cell.currentMonth ? 'text-[#1D264F]' : 'text-gray-300'}
                            `}>
                                {cell.day}
                            </span>

                            <div className="flex-1 w-full space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {dayTasks.map((task, tIdx) => (
                                    <div
                                        key={tIdx}
                                        title={task.title}
                                        className={`
                                            px-2 py-1 text-[10px] leading-tight rounded border truncate cursor-pointer transition-all
                                            ${task.platform === 'USTeP' ? 'bg-orange-50 border-orange-200 text-[#1D264F] hover:bg-orange-100' :
                                                task.platform === 'Canvas' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' :
                                                    'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}
                                        `}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 flex gap-4 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBB03B]"></span>
                    <span>USTeP Tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Canvas Tasks</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[#FBB03B]">Full calendar • Import or export calendars</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}} />
        </div>
    );
};

export default CalendarView;
