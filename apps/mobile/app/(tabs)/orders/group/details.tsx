import AmountInput from '@/components/AmountInput'
import { Button } from '@/components/ui/Button'
import { useAuthState } from '@/hooks/useAuthState'
import { useGroupOrders } from '@/hooks/useGroupOrders'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function GroupOrderDetails() {
  const router = useRouter()
  const params = useLocalSearchParams<{ group_order_id?: string }>()
  const { user } = useAuthState()
  const groupOrderId = params.group_order_id || ''
  
  const [amount, setAmount] = useState('')
  const { getGroupOrder, getBudgetDetails, chipInToBudget } = useGroupOrders()
  
  const [groupOrderData, setGroupOrderData] = useState<any>(null)
  const [budgetData, setBudgetData] = useState<any>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [isLoadingBudget, setIsLoadingBudget] = useState(false)
  const [isChippingIn, setIsChippingIn] = useState(false)
  
  const loadData = useCallback(async () => {
    try {
      setIsLoadingOrder(true)
      setIsLoadingBudget(true)
      const [orderResult, budgetResult] = await Promise.all([
        getGroupOrder(groupOrderId),
        getBudgetDetails(groupOrderId),
      ])
      if (orderResult.success) {
        setGroupOrderData({ success: true, data: orderResult })
      }
      if (budgetResult.success) {
        setBudgetData({ success: true, data: budgetResult })
      }
    } catch {
      // Error already handled in hook
    } finally {
      setIsLoadingOrder(false)
      setIsLoadingBudget(false)
    }
  }, [groupOrderId, getGroupOrder, getBudgetDetails])
  
  useEffect(() => {
    if (groupOrderId) {
      loadData()
    }
  }, [groupOrderId, loadData])
  
  const groupOrder = groupOrderData?.data
  const budget = budgetData?.data
  
  // Calculate remaining budget needed
  const remainingBudget = useMemo(() => {
    if (!budget) return 0
    const totalNeeded = budget.total_budget
    const currentTotal = budget.total_budget
    // This is a simplified calculation - you may want to use order total_amount
    return Math.max(0, totalNeeded - currentTotal)
  }, [budget])
  
  const handleCoverEverything = () => {
    if (remainingBudget > 0) {
      setAmount(remainingBudget.toFixed(2))
    }
  }
  
  const handleConfirm = async () => {
    if (!groupOrderId) {
      Alert.alert('Error', 'Group order ID is missing')
      return
    }
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }
    
    try {
      setIsChippingIn(true)
      const result = await chipInToBudget(groupOrderId, amountNum)
      if (result.success) {
        // Reload budget data
        await loadData()
        Alert.alert('Success', 'Your contribution has been added', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ])
      }
    } catch {
      // Error already handled in hook
    } finally {
      setIsChippingIn(false)
    }
  }
  
  if (isLoadingOrder || isLoadingBudget) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E6FFE8" />
          <Text style={styles.loadingText}>Loading budget details...</Text>
        </View>
      </SafeAreaView>
    )
  }
  
  if (!groupOrder || !budget) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load budget details</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View>
          <Text 
            style={[
              styles.title,
              {
                textShadowColor: '#FF3B30',
                textShadowOffset: { width: 4, height: 1.5 },
                textShadowRadius: 0.2,
              }
            ]}
          >
            Chip in an amount towards party order                   
          </Text>
          <Text style={{color:'#EAEAEA', paddingTop: 10, paddingBottom: 20}}>
            Enter the amount you want to chip in, it&apos;ll 
            go towards the total order cost
          </Text>
          
          {/* Budget Summary */}
          <View style={styles.budgetSummary}>
            <Text style={styles.budgetLabel}>Current Budget:</Text>
            <Text style={styles.budgetAmount}>£{budget.total_budget.toFixed(2)}</Text>
            {budget.initial_budget > 0 && (
              <Text style={styles.budgetInitial}>
                Initial: £{budget.initial_budget.toFixed(2)}
              </Text>
            )}
          </View>
          
          <View>
            <AmountInput amount={amount} setAmount={setAmount} />
            {remainingBudget > 0 && (
              <TouchableOpacity onPress={handleCoverEverything} style={styles.coverEverythingButton}>
                <Text style={styles.coverEverything}>
                  Cover everything (£{remainingBudget.toFixed(2)})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomActions}>
        <Button 
          variant='danger' 
          size='lg'
          onPress={handleConfirm}
          disabled={isChippingIn || !amount || parseFloat(amount) <= 0}
        >
          {isChippingIn ? (
            <ActivityIndicator size="small" color="#E6FFE8" />
          ) : (
            <Text>Confirm</Text>
          )}
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#02120A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#02120A',
        paddingVertical: 60,
        paddingHorizontal: 20,
        gap: 12,
    },
    coverEverything:{
        color:'#fff',
        fontWeight:400,
        fontSize:14,
        backgroundColor:"#5E685F",
        textAlign:'center',
        marginHorizontal:'auto',
        paddingHorizontal:20,
        paddingVertical:5,
        borderRadius:10
    },
    title: {
        color: '#FFFFFF', // text-white
        fontSize: 24, // text-2xl
        marginTop: 16, // mt-4
        fontWeight: '700', // font-bold
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#E6FFE8',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#E6FFE8',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#094327',
        fontSize: 16,
        fontWeight: '600',
    },
    budgetSummary: {
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.2)',
    },
    budgetLabel: {
        color: '#E6FFE8',
        fontSize: 14,
        marginBottom: 8,
    },
    budgetAmount: {
        color: '#E6FFE8',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    budgetInitial: {
        color: '#EAEAEA',
        fontSize: 12,
        opacity: 0.8,
    },
    coverEverythingButton: {
        marginTop: 12,
        alignSelf: 'center',
    },
})
