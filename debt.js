'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createDebt(formData) {
  try {
    const { userId } = auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) throw new Error('User not found')

    const debt = await prisma.debt.create({
      data: {
        name: formData.get('name'),
        type: formData.get('type'),
        totalAmount: parseFloat(formData.get('totalAmount')),
        currentBalance: parseFloat(formData.get('currentBalance')),
        interestRate: formData.get('interestRate') ? parseFloat(formData.get('interestRate')) : null,
        minPayment: formData.get('minPayment') ? parseFloat(formData.get('minPayment')) : null,
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')) : null,
        description: formData.get('description') || null,
        userId: user.id,
      },
    })

    revalidatePath('/main/debt-tracker')
    return { success: true, debt }
  } catch (error) {
    console.error('Error creating debt:', error)
    return { success: false, error: error.message }
  }
}

export async function getDebts() {
  try {
    const { userId } = auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) throw new Error('User not found')

    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        receipts: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return debts
  } catch (error) {
    console.error('Error fetching debts:', error)
    return []
  }
}

export async function updateDebt(debtId, formData) {
  try {
    const { userId } = auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) throw new Error('User not found')

    const debt = await prisma.debt.update({
      where: { 
        id: debtId,
        userId: user.id 
      },
      data: {
        name: formData.get('name'),
        type: formData.get('type'),
        totalAmount: parseFloat(formData.get('totalAmount')),
        currentBalance: parseFloat(formData.get('currentBalance')),
        interestRate: formData.get('interestRate') ? parseFloat(formData.get('interestRate')) : null,
        minPayment: formData.get('minPayment') ? parseFloat(formData.get('minPayment')) : null,
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')) : null,
        description: formData.get('description') || null,
        status: formData.get('status') || 'ACTIVE',
      },
    })

    revalidatePath('/main/debt-tracker')
    return { success: true, debt }
  } catch (error) {
    console.error('Error updating debt:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteDebt(debtId) {
  try {
    const { userId } = auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) throw new Error('User not found')

    await prisma.debt.delete({
      where: { 
        id: debtId,
        userId: user.id 
      }
    })

    revalidatePath('/main/debt-tracker')
    return { success: true }
  } catch (error) {
    console.error('Error deleting debt:', error)
    return { success: false, error: error.message }
  }
}

export async function createDebtPayment(formData) {
  try {
    const { userId } = auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) throw new Error('User not found')

    const debtId = formData.get('debtId')
    const amount = parseFloat(formData.get('amount'))

    // Create payment record
    const payment = await prisma.debtPayment.create({
      data: {
        amount,
        paymentDate: new Date(formData.get('paymentDate')),
        description: formData.get('description') || null,
        debtId,
        userId: user.id,
      },
    })

    // Update debt balance
    const debt = await prisma.debt.findUnique({
      where: { id: debtId }
    })

    const newBalance = Math.max(0, parseFloat(debt.currentBalance) - amount)
    const newStatus = newBalance === 0 ? 'PAID_OFF' : debt.status

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        currentBalance: newBalance,
        status: newStatus
      }
    })

    revalidatePath('/main/debt-tracker')
    return { success: true, payment }
  } catch (error) {
    console.error('Error creating debt payment:', error)
    return { success: false, error: error.message }
  }
}

export async function getDebtPayments(debtId) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) throw new Error('User not found')

    const payments = await prisma.debtPayment.findMany({
      where: { 
        debtId,
        userId: user.id 
      },
      orderBy: { paymentDate: 'desc' }
    })

    return payments
  } catch (error) {
    console.error('Error fetching debt payments:', error)
    return []
  }
}