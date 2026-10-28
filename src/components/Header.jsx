export default function Header({ total, toWatch }) {
  return (
    <header className="pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-4xl font-semibold leading-none sm:text-5xl">Our Movie Nights</h1>
      <p className="mt-2 text-mist">{toWatch} to watch, {total - toWatch} watched</p>
    </header>
  );
}