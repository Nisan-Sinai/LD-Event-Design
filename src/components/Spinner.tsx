/** מחוון טעינה משותף — לשומרי המסלולים ול-fallback של טעינת צ'אנקים עצלה. */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#B29259] border-t-transparent rounded-full animate-spin" role="status" aria-label="loading" />
    </div>
  );
}
