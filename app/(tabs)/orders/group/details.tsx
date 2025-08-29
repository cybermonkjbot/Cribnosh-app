import AmountInput from '@/components/AmountInput'
import { Button } from '@/components/ui/Button'
import { CartButton } from '@/components/ui/CartButton'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function GroupOrderDetails() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View>
          <Text 
          className="text-white text-2xl mt-4 font font-bold"
          style={{
          textShadowColor: '#FF3B30',
          textShadowOffset: { width: 4, height: 1.5 },
          textShadowRadius: 0.2,
          }}
          >
          Chip in an amount towards party order                   
           </Text>
          <Text style={{color:'#EAEAEA', paddingTop: 10, paddingBottom: 20}}>
             Enter the amount you want to chip in, it&apos;ll 
             go towards the total order cost
          </Text>
          <View >
            <AmountInput amount='' setAmount={() => {}}/>
            <TouchableOpacity>
              <Text style={styles.coverEverything}>
                Cover everything
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomActions}>
        <CartButton quantity={4} onPress={() => console.log('yes')} /> 
        <Button variant='danger' size='lg'>
          <Text>Confirm</Text>
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
})
