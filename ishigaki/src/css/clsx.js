export function getInputClass() {
  return [
    "px-4 py-3 rounded-md border border-blue-300",
    "focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-400"
  ].join(' ');
}

export function getButtonClass() {
  return [
    "mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-md shadow-md",
    "transition-colors duration-200"
  ].join(' ');
}