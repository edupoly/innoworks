const VerifiedBadge = ({ size = 'md', text = 'Verified' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-[12px]',
    lg: 'w-6 h-6 text-[14px]'
  };

  return (
    <div className="inline-flex items-center group relative">
      <svg 
        className={`${sizeClasses[size]} text-green-500 fill-current ml-1`} 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
      {text && size !== 'sm' && (
        <span className="ml-1 text-green-600 font-medium text-sm hidden group-hover:inline-block">
          {text}
        </span>
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
        Platform Verified Content
      </div>
    </div>
  );
};

export default VerifiedBadge;
