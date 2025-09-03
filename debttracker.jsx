'use client'

import { useState, useTransition } from 'react'
import { createDebt, updateDebt, deleteDebt, createDebtPayment } from '@/actions/debt'
import { Plus, Edit2, Trash2, DollarSign, Calendar, CreditCard, TrendingDown } from 'lucide-react'

const DEBT_TYPES = [
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'PERSONAL_LOAN', label: 'Personal Loan' },
  { value: 'HOME_LOAN', label: 'Home Loan' },
  { value: 'CAR_LOAN', label: 'Car Loan' },
  { value: 'EDUCATION_LOAN', label: 'Education Loan' },
  { value: 'EMI', label: 'EMI' },
  { value: 'OTHER', label: 'Other' },
]

const DEBT_STATUS = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAID_OFF', label: 'Paid Off', color: 'bg-green-100 text-green-800' },
  { value: 'OVERDUE', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  { value: 'PAUSED', label: 'Paused', color: 'bg-gray-100 text-gray-800' },
]

export default function DebtTracker({ initialDebts = [] }) {
  const [debts, setDebts] = useState(initialDebts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(null)
  const [editingDebt, setEditingDebt] = useState(null)
  const [isPending, startTransition] = useTransition()

  const handleAddDebt = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    startTransition(async () => {
      const result = await createDebt(formData)
      if (result.success) {
        setDebts(prev => [result.debt, ...prev])
        setShowAddForm(false)
        e.target.reset()
      } else {
        alert('Error creating debt: ' + result.error)
      }
    })
  }

  const handleUpdateDebt = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    startTransition(async () => {
      const result = await updateDebt(editingDebt.id, formData)
      if (result.success) {
        setDebts(prev => prev.map(debt => 
          debt.id === editingDebt.id ? result.debt : debt
        ))
        setEditingDebt(null)
      } else {
        alert('Error updating debt: ' + result.error)
      }
    })
  }

  const handleDeleteDebt = async (debtId) => {
    if (!confirm('Are you sure you want to delete this debt?')) return
    
    startTransition(async () => {
      const result = await deleteDebt(debtId)
      if (result.success) {
        setDebts(prev => prev.filter(debt => debt.id !== debtId))
      } else {
        alert('Error deleting debt: ' + result.error)
      }
    })
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    startTransition(async () => {
      const result = await createDebtPayment(formData)
      if (result.success) {
        // Refresh debts to show updated balance
        window.location.reload()
      } else {
        alert('Error adding payment: ' + result.error)
      }
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const getStatusColor = (status) => {
    return DEBT_STATUS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  const calculateProgress = (currentBalance, totalAmount) => {
    const paid = totalAmount - currentBalance
    return (paid / totalAmount) * 100
  }

  const totalDebt = debts.reduce((sum, debt) => sum + parseFloat(debt.currentBalance), 0)
  const totalOriginal = debts.reduce((sum, debt) => sum + parseFloat(debt.totalAmount), 0)
  const totalPaid = totalOriginal - totalDebt

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Debt</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Debts</p>
              <p className="text-2xl font-bold text-gray-900">{debts.filter(d => d.status === 'ACTIVE').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Debt Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Debts</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Debt
        </button>
      </div>

      {/* Add Debt Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Debt</h3>
          <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Credit Card - HDFC"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEBT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                name="totalAmount"
                step="0.01"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
              <input
                type="number"
                name="currentBalance"
                step="0.01"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="75000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                name="interestRate"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Payment</label>
              <input
                type="number"
                name="minPayment"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this debt..."
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {isPending ? 'Adding...' : 'Add Debt'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debts List */}
      <div className="grid gap-6">
        {debts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No debts found</h3>
            <p className="text-gray-500">Add your first debt to start tracking your payments.</p>
          </div>
        ) : (
          debts.map(debt => (
            <div key={debt.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">
                      {DEBT_TYPES.find(t => t.value === debt.type)?.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(debt.status)}`}>
                      {DEBT_STATUS.find(s => s.value === debt.status)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPaymentForm(debt.id)}
                    className="text-green-600 hover:text-green-700 p-2"
                    title="Add Payment"
                  >
                    <DollarSign className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingDebt(debt)}
                    className="text-blue-600 hover:text-blue-700 p-2"
                    title="Edit Debt"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Delete Debt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold">{formatCurrency(debt.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="font-semibold text-red-600">{formatCurrency(debt.currentBalance)}</p>
                </div>
                {debt.interestRate && (
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold">{debt.interestRate}%</p>
                  </div>
                )}
                {debt.minPayment && (
                  <div>
                    <p className="text-sm text-gray-600">Min Payment</p>
                    <p className="font-semibold">{formatCurrency(debt.minPayment)}</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{calculateProgress(debt.currentBalance, debt.totalAmount).toFixed(1)}% paid</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${calculateProgress(debt.currentBalance, debt.totalAmount)}%` }}
                  />
                </div>
              </div>

              {debt.description && (
                <p className="text-sm text-gray-600 mb-4">{debt.description}</p>
              )}

              {debt.dueDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due: {new Date(debt.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
            <form onSubmit={handleAddPayment}>
              <input type="hidden" name="debtId" value={showPaymentForm} />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Payment description (optional)"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {isPending ? 'Adding...' : 'Add Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}