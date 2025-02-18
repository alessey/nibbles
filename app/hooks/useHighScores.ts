import { useEffect, useState } from "react";
import { Score } from "@/lib/scores";
import { getTopScores } from "@/lib/scores-client";

export function useHighScores() {
  const [highScores, setHighScores] = useState<Score[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const scores = await getTopScores();
      setHighScores(scores ?? []);
    }
    fetchScores();
  }, []);

  return highScores;
}