"use client"

import { useState } from "react"
import { Eye, EyeOff, Pencil, Trash2, Check, X } from "lucide-react"
import { useTradeTracker } from "@/hooks/useTradeTracker"
import { aggregatePositions, stockCloses } from "@/lib/utils/trades"
import { computeFutures, futuresCloses } from "@/lib/utils/futures"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import BrokerSelector from "./BrokerSelector"
import PortfolioCard from "./PortfolioCard"
import TradeTransactions from "./TradeTransactions"
import StockHistory from "./StockHistory"
import FuturesPositionCard from "./futures/FuturesPositionCard"
import FuturesDetails from "./futures/FuturesDetails"
import FuturesHistory from "./futures/FuturesHistory"

export default function TradesTracker({ pageId }: { pageId: string }) {
  const {
    brokers, lots, sells, futures, loading,
    addBroker, updateBroker, deleteBroker,
    addLot, updateLot, deleteLot,
    addSell, updateSell, deleteSell,
    addFuturesTrade, updateFuturesTrade, deleteFuturesTrade,
  } = useTradeTracker(pageId)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stockTab, setStockTab] = useState<'portfolio' | 'transactions' | 'history'>('portfolio')
  const [cfdTab, setCfdTab] = useState<'positions' | 'details' | 'history'>('positions')
  const [visible, setVisible] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Active broker: the chosen one if it still exists, otherwise fall back to the first.
  const activeId = selectedId && brokers.some(b => b.id === selectedId) ? selectedId : (brokers[0]?.id ?? null)
  const broker = brokers.find(b => b.id === activeId) ?? null

  const brokerLots = broker ? lots.filter(l => l.account_id === broker.id) : []
  const brokerSells = broker ? sells.filter(s => s.account_id === broker.id) : []
  // Portfolio shows only still-held positions (remaining shares > 0).
  const positions = aggregatePositions(brokerLots, brokerSells).filter(p => p.volume > 1e-9)
  const closed = stockCloses(brokerLots, brokerSells)

  const brokerFutures = broker ? futures.filter(t => t.account_id === broker.id) : []
  const { positions: openPositions, realizedByTrade } = computeFutures(brokerFutures)
  const cfdCloses = futuresCloses(brokerFutures)
  // Remember each instrument's most-recent contract size to pre-fill the form.
  const contractSizeByInstrument: Record<string, number> = {}
  for (const t of brokerFutures) {
    const k = t.instrument.trim().toUpperCase()
    if (!(k in contractSizeByInstrument)) contractSizeByInstrument[k] = t.contract_size
  }

  function selectBroker(id: string) {
    setSelectedId(id)
    setRenaming(false)
  }

  async function saveRename() {
    if (broker && renameValue.trim()) await updateBroker(broker.id, { name: renameValue.trim() })
    setRenaming(false)
  }

  async function handleDeleteBroker() {
    if (!broker) return
    await deleteBroker(broker.id)
    setConfirmDelete(false)
    setSelectedId(null)
  }

  if (loading) return <p className="text-sm text-muted-foreground text-center">Loading...</p>

  return (
    <div className="space-y-6">
      {confirmDelete && broker && (
        <ConfirmDialog
          message={`Delete broker "${broker.name}"? All its data will also be deleted.`}
          onConfirm={handleDeleteBroker}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <BrokerSelector brokers={brokers} selectedId={activeId} onSelect={selectBroker} onAdd={addBroker} />

      {brokers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Add a broker to start tracking your portfolio.</p>
      )}

      {broker && (
        <div className="space-y-4">
          {/* Broker header: rename / delete / hide values (shared by stock & futures) */}
          <div className="flex items-center justify-between gap-2">
            {renaming ? (
              <div className="flex items-center gap-2 flex-1">
                <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} className="text-sm h-8" autoFocus />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRenaming(false)}><X size={14} /></Button>
                <Button size="icon" className="h-8 w-8" onClick={saveRename}><Check size={14} /></Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-semibold truncate">{broker.name}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{broker.currency}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setVisible(v => !v)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    title={visible ? 'Hide values' : 'Show values'}
                  >
                    {visible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => { setRenameValue(broker.name); setRenaming(true) }}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Rename broker"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete broker"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}
          </div>

          {broker.broker_type === 'stock' ? (
            <>
              {/* Portfolio / Transactions / History tabs */}
              <div className="flex justify-center">
                <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
                  {([
                    { key: 'portfolio', label: 'Portfolio' },
                    { key: 'transactions', label: 'Transactions' },
                    { key: 'history', label: 'History' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStockTab(key)}
                      className={`px-3.5 py-1 rounded-full transition-colors ${
                        stockTab === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {stockTab === 'portfolio' && (
                positions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No stocks yet. Add one from the Transactions tab.</p>
                ) : (
                  <div className="space-y-2">
                    {positions.map(pos => (
                      <PortfolioCard
                        key={pos.stock_code}
                        position={pos}
                        broker={broker}
                        visible={visible}
                        onDeleteLot={deleteLot}
                        onUpdateLot={updateLot}
                        onSell={addSell}
                      />
                    ))}
                  </div>
                )
              )}

              {stockTab === 'transactions' && (
                <TradeTransactions
                  broker={broker}
                  lots={brokerLots}
                  sells={brokerSells}
                  visible={visible}
                  onAddLot={addLot}
                  onUpdateLot={updateLot}
                  onDeleteLot={deleteLot}
                  onUpdateSell={updateSell}
                  onDeleteSell={deleteSell}
                />
              )}

              {stockTab === 'history' && (
                <StockHistory closes={closed} broker={broker} visible={visible} />
              )}
            </>
          ) : (
            <>
              {/* Open Positions / Position details / History tabs */}
              <div className="flex justify-center">
                <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
                  {([
                    { key: 'positions', label: 'Open Positions' },
                    { key: 'details', label: 'Position details' },
                    { key: 'history', label: 'History' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setCfdTab(key)}
                      className={`px-3.5 py-1 rounded-full transition-colors ${
                        cfdTab === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {cfdTab === 'positions' && (
                openPositions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No open positions.</p>
                ) : (
                  <div className="space-y-2">
                    {openPositions.map(pos => (
                      <FuturesPositionCard
                        key={pos.instrument}
                        position={pos}
                        broker={broker}
                        visible={visible}
                        contractSizeByInstrument={contractSizeByInstrument}
                        onClose={addFuturesTrade}
                      />
                    ))}
                  </div>
                )
              )}

              {cfdTab === 'details' && (
                <FuturesDetails
                  broker={broker}
                  trades={brokerFutures}
                  realizedByTrade={realizedByTrade}
                  contractSizeByInstrument={contractSizeByInstrument}
                  visible={visible}
                  onAdd={addFuturesTrade}
                  onUpdate={updateFuturesTrade}
                  onDelete={deleteFuturesTrade}
                />
              )}

              {cfdTab === 'history' && (
                <FuturesHistory closes={cfdCloses} broker={broker} visible={visible} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
