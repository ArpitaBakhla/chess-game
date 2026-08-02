import { ChessBoardComponent } from './components/ChessBoard'
import { useGameStore } from './store/useGameStore'
import { Settings, Play, Users, MonitorSmartphone, Brain, Sun, Moon } from 'lucide-react'
import { useTheme } from './components/ThemeProvider'

function App() {
  const { mode, setGameMode, difficulty, setDifficulty, history } = useGameStore()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <header className="w-full border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <MonitorSmartphone size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">ChessVerse</h1>
          </div>
          <nav className="flex gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Settings size={20} />
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 justify-center items-start">
        <div className="w-full lg:w-auto">
          <ChessBoardComponent />
        </div>
        
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold mb-4">Play Mode</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setGameMode('hotseat')}
                className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all ${mode === 'hotseat' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
              >
                <Users size={20} />
                <div className="text-left">
                  <div className="font-semibold text-sm">Local Match</div>
                  <div className="text-xs opacity-80">Play a friend on this device</div>
                </div>
              </button>
              
              <button 
                onClick={() => setGameMode('ai')}
                className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all ${mode === 'ai' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
              >
                <Play size={20} />
                <div className="text-left">
                  <div className="font-semibold text-sm">Play Computer</div>
                  <div className="text-xs opacity-80">Practice against Stockfish</div>
                </div>
              </button>
            </div>
            
            {mode === 'ai' && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Brain size={16} /> AI Difficulty
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`text-xs p-2 rounded border capitalize transition-colors ${
                        difficulty === diff 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-xl border shadow-sm flex-1 flex flex-col">
             <h3 className="text-lg font-bold mb-4">Move History</h3>
             <div className="text-sm flex-1 overflow-y-auto border-2 border-dashed rounded-lg p-4 bg-muted/30 max-h-[300px]">
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground italic">
                    Moves will appear here
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {history.reduce((result: any[], move, index) => {
                      if (index % 2 === 0) {
                        result.push([move]);
                      } else {
                        result[result.length - 1].push(move);
                      }
                      return result;
                    }, []).map((pair, i) => (
                      <div key={i} className="col-span-2 grid grid-cols-[30px_1fr_1fr] border-b pb-1">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span className="font-medium">{pair[0].san}</span>
                        <span className="font-medium">{pair[1] ? pair[1].san : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
