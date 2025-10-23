const TabButton = ({ active, onClick, children, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs font-mono uppercase transition-all duration-100 ${
            active
                ? 'text-green-400 bg-slate-700 border-l-2 border-green-400'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            } ${className}`}
            >
            {children}
        </button>
    );
};


export default TabButton;