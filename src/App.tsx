import { ListInput } from './components/ListInput';
import { Matchup } from './components/Matchup';
import { ProgressMeter } from './components/ProgressMeter';
import { RankedList } from './components/RankedList';
import { ExportButton } from './components/ExportButton';
import { SavedLists } from './components/SavedLists';
import { useListRanking } from './hooks/useListRanking';

export const App = () => {
  const {
    isOnList,
    savedLists,
    currentPair,
    items,
    completedPairsCount,
    totalPairs,
    handleStartRanking,
    handleSelect,
    handleResumeList,
    handleDeleteList,
    handleReset,
    handleAddItems,
    handleDeleteItem,
    handleResetItemElo,
    handleResetAllScores,
  } = useListRanking();

  return (
    <div className="min-h-screen p-6 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1
          onClick={handleReset}
          className="text-2xl text-bg md:text-4xl font-bold uppercase tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
        >
          Elo List Ranker
        </h1>
        {isOnList && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wide hover:bg-(--fg) hover:text-(--bg)"
          >
            Back
          </button>
        )}
      </header>

      {!isOnList && (
        <div className="max-w-2xl mx-auto">
          <ListInput onSubmit={handleStartRanking} />
          <SavedLists
            lists={savedLists}
            onResume={handleResumeList}
            onDelete={handleDeleteList}
          />
        </div>
      )}

      {isOnList && (
        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          <div className="space-y-6">
            <ProgressMeter completed={completedPairsCount} total={totalPairs} />

            {currentPair ? (
              <Matchup
                itemA={currentPair[0]}
                itemB={currentPair[1]}
                onSelect={handleSelect}
              />
            ) : (
              <div className="border-(--border) border-2 p-8 text-center">
                <p className="text-xl font-bold mb-4">All pairs compared!</p>
                <p className="mono text-sm opacity-60">
                  Export your ranked list below
                </p>
              </div>
            )}

            <button
              onClick={handleResetAllScores}
              className="px-4 py-2 text-sm font-bold uppercase tracking-wide border-(--border) border-2 hover:bg-(--fg) hover:text-(--bg)"
            >
              Reset All Scores
            </button>
          </div>

          <aside className="space-y-6">
            <RankedList
              items={items}
              onDeleteItem={handleDeleteItem}
              onResetItemElo={handleResetItemElo}
            />
            <ExportButton items={items} />
            <div className="border-(--border) border-2 p-4">
              <ListInput
                onSubmit={handleAddItems}
                existingNames={items.map((i) => i.name)}
                mode="merge"
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;
