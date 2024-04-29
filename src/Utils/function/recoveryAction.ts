export function generateRecovery(): string {
  const initialRecovery = [1, 1, 1, 1, 1, 1];
  return initialRecovery
    .map((value) => value + Math.floor(Math.random() * 9))
    .join('');
}
