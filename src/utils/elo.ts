/**
 * Calculate expected score (probability of winning) for player A against player B
 * Based on the Elo rating formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Update ratings after a match
 * Returns [newWinnerRating, newLoserRating]
 * K-factor determines how much ratings change per match (default 32)
 */
export const updateRatings = (
  winnerRating: number,
  loserRating: number,
  K: number = 32
): [number, number] => {
  const expectedWinner = calculateExpectedScore(winnerRating, loserRating)
  const expectedLoser = calculateExpectedScore(loserRating, winnerRating)

  // Winner scored 1 (win), loser scored 0 (loss)
  const newWinnerRating = Math.round(winnerRating + K * (1 - expectedWinner))
  const newLoserRating = Math.round(loserRating + K * (0 - expectedLoser))

  return [newWinnerRating, newLoserRating]
}

/**
 * Initial Elo rating for new items
 */
export const INITIAL_ELO = 1000

