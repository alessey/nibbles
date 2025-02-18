import { Name } from "@coinbase/onchainkit/identity";
import { Identity } from "@coinbase/onchainkit/identity";
import { useHighScores } from "../hooks/useHighScores";
import ArrowSvg from "../svg/ArrowSvg";

export function HighScores() {
  const highScores = useHighScores();

  return (
    <div className="flex flex-col items-center justify-center absolute top-48 w-[80%]">
    <h1 className="text-2xl mb-4">High Scores</h1>
    {highScores.sort((a, b) => b.score - a.score).map((score, index) => (
      <button type="button" key={score.attestationUid} className="flex items-center w-full" onClick={() => {
        window.open(`https://basescan.org/tx/${score.transactionHash}`, '_blank');
      }}>
        <span className="text-black w-8">{index + 1}.</span>
        <div className="flex items-center flex-grow">
          <Identity
            className="!bg-inherit space-x-1 px-0 [&>div]:space-x-2"
            address={score.address}
          >
            <Name className="text-black"/>
          </Identity>
          <div className="px-2">
            <ArrowSvg />
          </div>
        </div>
        <div className="text-black text-right flex-grow">{score.score}</div>
      </button>
    ))}
  </div>
)
}