"use client"

import { useState } from "react"
import { Eye, EyeOff, Pencil, Trash2, Check, X } from "lucide-react"
import { useTradeTracker } from "@/hooks/useTradeTracker"
import { aggregatePositions } from "@/lib/utils/trades"
import { computeFutures } from "@/lib/utils/futures"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import BrokerSelector from "./BrokerSelector"
import PortfolioCard from "./PortfolioCard"
import TradeTransactions from "./TradeTransactions"
import FuturesPositionCard from "./futures/FuturesPositionCard"
import FuturesDetails from "./futures/FuturesDetails"

export default function TradesTracker({ pageId }: { pageId: string }) {
  const {
    brokers, lots, sells, futures, loading,
    addBroker, updateBroker, deleteBroker,
    addLot, updateLot, deleteLot,
    addSell, updateSell, deleteSell,
    addFuturesTrade, updateFuturesTrade, deleteFuturesTrade,
  } = useTradeTracker(pageId)

  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const brokerFutures = broker ? futures.filter(t => t.account_id === broker.id) : []
  const { positions: openPositions, realizedByTrade } = computeFutures(brokerFutures)
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
              {/* Section 1: Portfolio (cumulative holdings) */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portfolio</h3>
                {positions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No stocks yet. Add a transaction below.</p>
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
                )}
              </section>

              {/* Section 2: Transactions (Finance-style) */}
              <section className="space-y-3 pt-2 border-t border-gray-400">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">Transactions</h3>
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
              </section>
            </>
          ) : (
            <>
              {/* Section 1: Open Positions (net per instrument) */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open Positions</h3>
                {openPositions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No open positions. Add a transaction below.</p>
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
                )}
              </section>

              {/* Section 2: Position details (Finance-style) */}
              <section className="space-y-3 pt-2 border-t border-gray-400">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">Position details</h3>
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
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}
