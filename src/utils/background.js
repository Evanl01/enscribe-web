

export function debugElements(state) {
  // Assign each property to window for console access
  Object.entries(state).forEach(([key, value]) => {
    window[key] = value;
  });
  // Print all to console
  console.log("Debug Elements:", state);
}