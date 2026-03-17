// FILE: frontend/src/components/PaymentForm.vue
<template>
  <div class="payment-form">
    <h3>Add Money to Wallet</h3>
    <form @submit.prevent="createOrder">
      <div class="field-wrap">
        <label class="field-label">Amount (₹)</label>
        <input v-model.number="amount" type="number" min="1" required class="field" placeholder="100" />
      </div>
      <button type="submit" class="btn btn-gold" :disabled="loading">
        {{ loading ? 'Processing...' : 'Add Money' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'
import { useNotification } from '../services/notification'

const emit = defineEmits(['paymentSuccess'])
const notification = useNotification()

const amount = ref(100)
const loading = ref(false)

const createOrder = async () => {
  if (amount.value < 1) return notification.add('Minimum amount is ₹1', 'error')
  
  loading.value = true
  try {
    const res = await api.post('/api/payments/create-order', { amount: amount.value })
    const { orderId, amount: orderAmount, key } = res.data
    
    // Load Razorpay script if not loaded
    if (!window.Razorpay) {
      await loadRazorpay()
    }
    
    const options = {
      key,
      amount: orderAmount,
      currency: 'INR',
      name: 'BidWars',
      description: 'Add Money to Wallet',
      order_id: orderId,
      handler: async (response) => {
        await verifyPayment(response)
      },
      prefill: {
        name: 'User',
        email: 'user@example.com'
      },
      theme: {
        color: '#FFD700'
      }
    }
    
    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (error) {
    notification.add('Failed to create payment order', 'error')
  } finally {
    loading.value = false
  }
}

const verifyPayment = async (response) => {
  try {
    await api.post('/api/payments/verify', {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature
    })
    notification.add('Payment successful! Money added to wallet.', 'success')
    emit('paymentSuccess')
  } catch (error) {
    notification.add('Payment verification failed', 'error')
  }
}

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    document.head.appendChild(script)
  })
}
</script>

<style scoped>
.payment-form {
  padding: 20px;
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.payment-form h3 {
  margin-bottom: 16px;
  color: var(--text-1);
}
</style>