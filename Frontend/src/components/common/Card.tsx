interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card = ({ children, className = "", title }: CardProps) => {
  return (
    <div
      className={`bg-exchange-surface rounded-lg p-4 shadow-md ${className}`}
    >
      {title && (
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};
