import { Link } from "react-router";

export function RoutinesListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Routines</h1>
      <p className="mt-2 text-sm text-gray-600">Your saved routines will appear here.</p>
      <Link to="/exercises" className="mt-4 inline-block text-sm text-blue-600 underline">
        Browse exercise library →
      </Link>
    </div>
  );
}
