<template>
  <div style="background: var(--bg-page); min-height: 100vh; padding: 32px 16px;">
    <div style="max-width: 1280px; margin: 0 auto;">

      <!-- Header -->
      <div class="animate-in" style="margin-bottom: 32px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--accent-soft); color: var(--accent); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
            <v-icon size="12">mdi-shield-crown-outline</v-icon>
            Admin Panel
          </div>
          <h1 class="font-display" style="font-size: 36px; color: var(--text-primary); margin: 0 0 8px; font-weight: 400;">Auction Management</h1>
          <p style="color: var(--text-secondary); font-size: 15px; margin: 0;">Create and manage all platform auctions</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; background: var(--success-soft); border: 1px solid var(--success); padding: 10px 16px; border-radius: 10px;">
          <span class="live-dot" style="background: var(--success);"></span>
          <span style="font-size: 13px; color: var(--success); font-weight: 600;">System Online</span>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 4px; margin-bottom: 28px; background: var(--bg-card); padding: 4px; border-radius: 10px; border: 1px solid var(--border-color); overflow-x: auto; width: fit-content;" class="animate-in animate-in-delay-1">
        <button
          v-for="t in tabs"
          :key="t.value"
          @click="tab = t.value"
          :style="{
            padding: '8px 20px',
            borderRadius: '7px',
            border: 'none',
            background: tab === t.value ? 'var(--bg-page)' : 'transparent',
            color: tab === t.value ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: tab === t.value ? '600' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: tab === t.value ? 'var(--shadow-sm)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap'
          }"
        >
          <v-icon size="15">{{ t.icon }}</v-icon>
          {{ t.label }}
          <span v-if="t.count > 0" style="background: var(--accent); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">{{ t.count }}</span>
        </button>
      </div>

      <!-- Command Center Overview -->
      <div v-if="tab === 'overview'" class="animate-in animate-in-delay-2">
        <!-- Rapid Metrics Carousel -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">
          <div v-for="metric in [
            { label: 'Active Liquidity', value: '₹' + (stats.totalLiquidity || 0).toLocaleString(), icon: 'mdi-bank-outline', color: 'accent' },
            { label: 'Identity Filter', value: pendingVerifications.length, sub: 'Pending Review', icon: 'mdi-shield-account-outline', color: 'warning' },
            { label: 'Market Integrity', value: flaggedAuctions.length, sub: 'Active Alerts', icon: 'mdi-shield-alert-outline', color: 'error' },
            { label: 'Pending Settlement', value: claims.length, sub: 'Open Disputes', icon: 'mdi-scale-balance', color: 'primary' }
          ]" :key="metric.label" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
              <div :style="{ background: `var(--${metric.color}-soft)`, padding: '8px', borderRadius: '8px' }">
                <v-icon :color="metric.color" size="20">{{ metric.icon }}</v-icon>
              </div>
            </div>
            <div style="font-size: 24px; font-weight: 800; color: var(--text-primary); line-height: 1;">{{ metric.value }}</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px;">{{ metric.label }}</div>
            <div v-if="metric.sub" style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">{{ metric.sub }}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px;">
          <!-- Left: Platform Pulse -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary);">Market Throughput</h3>
                <v-btn variant="text" size="small" color="primary" @click="tab = 'analytics'">View Detailed Intel</v-btn>
              </div>
              <div style="height: 300px;">
                <Bar :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Recent Proposals -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden;">
              <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Awaiting Floor Access</h3>
                <span style="font-size: 12px; color: var(--accent); font-weight: 700;">{{ pendingAuctions.length }} PROPOSALS</span>
              </div>
              <div v-if="pendingAuctions.length > 0">
                <div v-for="a in pendingAuctions.slice(0, 3)" :key="a.id" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 16px;">
                  <v-avatar rounded="lg" size="40" color="grey-lighten-4">
                    <v-img :src="a.imageUrl || placeholder" cover></v-img>
                  </v-avatar>
                  <div style="flex: 1;">
                    <div style="font-size: 14px; font-weight: 600; color: var(--text-primary);">{{ a.title }}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">₹{{ a.minBid.toLocaleString() }} · Proposed by {{ a.sellerName || 'Verified User' }}</div>
                  </div>
                  <v-btn color="primary" variant="flat" size="small" @click="reviewProposal(a.id, true)" style="border-radius: 6px;">Approve</v-btn>
                </div>
              </div>
              <div v-else style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px;">Queue is clear. No pending proposals.</div>
            </div>
          </div>

          <!-- Right: Operation Nexus -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Rapid Deploy -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px;">
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">Nexus Control</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <v-btn block color="accent" variant="tonal" class="rounded-lg" height="60" @click="tab = 'create'">
                  <div class="d-flex flex-column align-center">
                    <v-icon size="20">mdi-plus-box</v-icon>
                    <span style="font-size: 10px; font-weight: 800; margin-top: 4px;">NEW LOT</span>
                  </div>
                </v-btn>
                <v-btn block color="warning" variant="tonal" class="rounded-lg" height="60" @click="tab = 'verifications'">
                  <div class="d-flex flex-column align-center">
                    <v-icon size="20">mdi-account-check</v-icon>
                    <span style="font-size: 10px; font-weight: 800; margin-top: 4px;">VERIFY</span>
                  </div>
                </v-btn>
                <v-btn block color="error" variant="tonal" class="rounded-lg" height="60" @click="tab = 'flagged'">
                  <div class="d-flex flex-column align-center">
                    <v-icon size="20">mdi-security</v-icon>
                    <span style="font-size: 10px; font-weight: 800; margin-top: 4px;">SECURITY</span>
                  </div>
                </v-btn>
                <v-btn block color="success" variant="tonal" class="rounded-lg" height="60" @click="fetchData">
                  <div class="d-flex flex-column align-center">
                    <v-icon size="20">mdi-sync</v-icon>
                    <span style="font-size: 10px; font-weight: 800; margin-top: 4px;">REFRESH</span>
                  </div>
                </v-btn>
              </div>
            </div>

            <!-- Distribution Visualizer -->
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px;">
              <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px;">Membership Tiers</h3>
              <div v-if="stats.tierDistribution" style="display: flex; flex-direction: column; gap: 16px;">
                <div v-for="(count, tier) in stats.tierDistribution" :key="tier">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">{{ tier.toUpperCase() }} CLASS</span>
                    <span style="font-size: 12px; color: var(--text-muted);">{{ count }} USERS</span>
                  </div>
                  <div style="height: 6px; background: var(--bg-subtle); border-radius: 3px; overflow: hidden;">
                    <div :style="{ 
                      width: (count / allUsers.length * 100) + '%', 
                      height: '100%', 
                      background: tier === 'Gold' ? '#fbbf24' : (tier === 'Silver' ? '#94a3b8' : '#b45309') 
                    }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Auction Tab -->
      <div v-if="tab === 'create'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; max-width: 720px;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color);">
            <h2 style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); margin: 0 0 4px; font-weight: 400;">Create New Auction</h2>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Add a new item to the live marketplace</p>
          </div>
          <div style="padding: 28px 24px;">
            <form @submit.prevent="createAuction" style="display: flex; flex-direction: column; gap: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Item Title *</label>
                  <input v-model="newAuction.title" required placeholder="e.g. Vintage Rolex Submariner" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Category *</label>
                  <select v-model="newAuction.category" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; cursor: pointer; font-family: 'DM Sans', sans-serif;">
                    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
              </div>

              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary);">Description *</label>
                  <button 
                    type="button" 
                    @click="generateAIDescription" 
                    :disabled="aiGenerating || !newAuction.title"
                    style="font-size: 11px; font-weight: 700; color: var(--accent); background: var(--accent-soft); border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                  >
                    <v-icon size="12" icon="mdi-sparkles"></v-icon>
                    {{ aiGenerating ? 'Enriching...' : 'AI Enhance' }}
                  </button>
                </div>
                <textarea v-model="newAuction.description" rows="4" placeholder="Describe the item in detail..." style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; resize: vertical; font-family: 'DM Sans', sans-serif; line-height: 1.6;"></textarea>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Starting Bid (₹) *</label>
                  <input v-model.number="newAuction.minBid" type="number" min="1" placeholder="50000" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Buy It Now Price (₹)</label>
                  <input v-model.number="newAuction.buyItNow" type="number" placeholder="Optional" style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Image URL</label>
                <input v-model="newAuction.imageUrl" placeholder="https://..." style="width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif;" />
              </div>

              <div style="padding-top: 4px; display: flex; align-items: center; gap: 12px;">
                <button type="submit" :disabled="submitting" style="background: var(--accent); color: white; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 8px; transition: background 0.15s;">
                  <v-progress-circular v-if="submitting" size="16" width="2" indeterminate color="white"></v-progress-circular>
                  <v-icon v-else size="16">mdi-plus</v-icon>
                  {{ submitting ? 'Creating...' : 'Create Auction' }}
                </button>
                <span style="font-size: 12px; color: var(--text-muted);">* Required fields</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Manage Auctions Tab -->
      <div v-if="tab === 'auctions'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <h2 style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); margin: 0; font-weight: 400;">Active Auctions ({{ auctions.length }})</h2>
            <button @click="fetchData" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 6px;">
              <v-icon size="14">mdi-refresh</v-icon> Refresh
            </button>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 600px;" class="clean-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Current Bid</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in auctions" :key="a.id">
                <td>
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 56px; height: 42px; border-radius: 8px; overflow: hidden; background: var(--bg-subtle); flex-shrink: 0;">
                      <v-img :src="a.imageUrl || placeholder" cover style="width: 100%; height: 100%;"></v-img>
                    </div>
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">{{ a.title }}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">{{ a.category }} · {{ a.id.slice(0,10).toUpperCase() }}</div>
                    </div>
                  </div>
                </td>
                <td style="text-align: right;">
                  <span class="bid-amount" style="font-size: 16px; color: var(--text-primary);">₹{{ (a.highestBid || a.minBid).toLocaleString() }}</span>
                </td>
                <td style="text-align: center;">
                  <span class="live-badge" style="display: inline-flex;"><span class="live-dot"></span>Live</span>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <router-link :to="'/auctions/' + a.id" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; text-decoration: none;">View</router-link>
                    <button @click="startEdit(a)" style="background: var(--bg-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer;">Edit</button>
                    <button @click="closeAuction(a.id)" style="background: var(--warning-soft); color: var(--warning); border: 1px solid var(--warning); padding: 6px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;">End</button>
                    <button @click="deleteAuction(a.id)" style="background: #FEF2F2; color: #E53E3E; border: 1px solid #FECACA; padding: 6px 10px; border-radius: 7px; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center;">
                      <v-icon size="13">mdi-delete-outline</v-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="auctions.length === 0">
                <td colspan="4" style="text-align: center; padding: 48px; color: var(--text-muted); font-size: 14px;">No auctions yet. Create one above.</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <!-- Flagged Tab -->
      <div v-if="tab === 'flagged'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 24px; border-bottom: 1px solid var(--border-color); background: linear-gradient(to right, #FFF5F5, transparent);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
              <v-icon color="error">mdi-shield-alert-outline</v-icon>
              <h2 style="font-size: 20px; font-weight: 700; color: #C53030; margin: 0;">Market Surveillance Alerts</h2>
            </div>
            <p style="font-size: 13px; color: #9B2C2C; margin: 0;">Automated detection of shill bidding and IP collisions</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;" class="clean-table">
            <thead>
              <tr style="background: var(--bg-page);">
                <th style="padding: 16px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Asset Identification</th>
                <th style="padding: 16px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Forensic Detail</th>
                <th style="padding: 16px 24px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Direct Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in flaggedAuctions" :key="a.id" style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 16px 24px;">
                  <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">{{ a.title }}</div>
                  <div style="font-family: monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase;">ID: {{ a.id }}</div>
                </td>
                <td style="padding: 16px 24px;">
                  <div style="background: #FFF5F5; color: #C53030; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border-left: 3px solid #E53E3E; display: inline-block;">
                    {{ a.flagReason || 'Unspecified suspicious activity' }}
                  </div>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <v-btn color="primary" variant="tonal" size="small" class="rounded-lg font-weight-bold" @click="auditUser(a.sellerId, 'Seller')">Audit Seller</v-btn>
                    <v-btn color="error" variant="flat" size="small" class="rounded-lg font-weight-bold" @click="deleteAuction(a.id)">Liquidate</v-btn>
                  </div>
                </td>
              </tr>
              <tr v-if="flaggedAuctions.length === 0">
                <td colspan="3" style="text-align: center; padding: 60px; color: var(--text-muted);">
                   <v-icon size="48" color="grey-lighten-3" class="mb-4">mdi-shield-check-outline</v-icon>
                   <div style="font-size: 14px;">No security threats detected in the current session.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Disputes Tab -->
      <div v-if="tab === 'disputes'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 24px; border-bottom: 1px solid var(--border-color); background: var(--bg-subtle);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0;">Settlement Disputes</h2>
                <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0;">Mediate conflicts between buyers and curators</p>
              </div>
              <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">{{ claims.length }} OPEN CASES</v-chip>
            </div>
          </div>
          <div v-if="claims.length > 0">
            <div v-for="c in claims" :key="c.id" style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                  <span style="font-family: monospace; font-size: 12px; font-weight: 800; background: var(--bg-page); padding: 4px 8px; border-radius: 4px; color: var(--accent);">ORDER #{{ c.auctionId.slice(0,8).toUpperCase() }}</span>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">INITIATED {{ new Date(c.createdAt).toLocaleDateString() }}</span>
                </div>
                <div style="font-size: 14px; color: var(--text-primary); font-weight: 600;">{{ c.reason }}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">User Reference: {{ c.initiatorId.slice(0,12) }}...</div>
              </div>
              <div style="display: flex; gap: 10px;">
                <v-btn color="success" variant="tonal" size="small" rounded="lg" @click="resolveDispute(c.id, 'resolved', 'Release Funds')">Release to Seller</v-btn>
                <v-btn color="warning" variant="tonal" size="small" rounded="lg" @click="resolveDispute(c.id, 'resolved', 'Refund Issued')">Refund Buyer</v-btn>
              </div>
            </div>
          </div>
          <div v-else style="padding: 80px 40px; text-align: center;">
            <v-icon size="48" color="grey-lighten-4" class="mb-4">mdi-scale-balance</v-icon>
            <div style="font-size: 14px; color: var(--text-muted);">The platform is currently operating at 100% harmony. No active disputes.</div>
          </div>
        </div>
      </div>

      <!-- Intelligence (Analytics) Tab -->
      <div v-if="tab === 'analytics'" class="animate-in animate-in-delay-2">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Market Liquidity</div>
            <div style="font-size: 32px; font-weight: 800; color: var(--text-primary);">₹{{ stats.totalLiquidity?.toLocaleString() }}</div>
            <div style="font-size: 13px; color: var(--success); font-weight: 600; margin-top: 4px;">Total Wallet Deposits</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Platform Revenue</div>
            <div style="font-size: 32px; font-weight: 800; color: var(--accent);">₹{{ stats.platformFees?.toLocaleString() }}</div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Net Fees (Dynamic Tiers)</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Security Pulse</div>
            <div style="font-size: 32px; font-weight: 800; color: var(--error);">{{ stats.fraudAlerts || 0 }}</div>
            <div style="font-size: 13px; color: var(--error); font-weight: 600; margin-top: 4px;">Active Shill Bidding Flags</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 24px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px;">Volume Trend (7D)</h3>
            <div style="height: 350px;">
              <Bar v-if="stats.timeSeries" :data="chartData" :options="chartOptions" />
              <div v-else style="height: 100%; display: flex; align-items: center; justify-content: center;">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px;">
              <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px;">Tier Distribution</h3>
              <div v-if="stats.tierDistribution" class="d-flex flex-column gap-6">
                <div v-for="(count, tier) in stats.tierDistribution" :key="tier">
                  <div class="d-flex justify-space-between align-end mb-2">
                    <div>
                      <div style="font-size: 11px; font-weight: 900; color: var(--text-muted); text-transform: uppercase;">{{ tier }} Class</div>
                      <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">{{ count }} <small style="font-size: 11px; font-weight: 400; color: var(--text-muted);">members</small></div>
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: var(--accent);">{{ Math.round(count / (allUsers.length || 1) * 100) }}%</div>
                  </div>
                  <v-progress-linear
                    :model-value="(count / (allUsers.length || 1) * 100)"
                    :color="tier === 'Gold' ? '#fbbf24' : (tier === 'Silver' ? '#94a3b8' : '#b45309')"
                    height="8"
                    rounded
                  ></v-progress-linear>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Verifications Tab -->
      <div v-if="tab === 'verifications'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 24px; border-bottom: 1px solid var(--border-color); background: var(--bg-subtle);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0;">Identity Screening Queue</h2>
                <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0;">KYC Level 3 verification for high-stake curators</p>
              </div>
              <v-chip color="warning" variant="tonal" size="small" class="font-weight-bold">{{ pendingVerifications.length }} AWAITING REVIEW</v-chip>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;" class="clean-table">
            <thead>
              <tr style="background: var(--bg-page);">
                <th style="padding: 16px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Applicant Profile</th>
                <th style="padding: 16px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Submission Payload</th>
                <th style="padding: 16px 24px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Determination</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in pendingVerifications" :key="user.uid" style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 16px 24px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <v-avatar color="accent" size="32">{{ user.username[0].toUpperCase() }}</v-avatar>
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">{{ user.username }}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 16px 24px;">
                  <div style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">
                    {{ user.kycSubmittedAt ? new Date(user.kycSubmittedAt.toDate ? user.kycSubmittedAt.toDate() : user.kycSubmittedAt).toLocaleString() : 'Recent Submission' }}
                  </div>
                  <div style="font-size: 11px; color: var(--accent); margin-top: 2px;">Verification Status: PENDING_REVIEW</div>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <v-btn color="success" variant="flat" size="small" rounded="lg" @click="processKYC(user.uid, 'approved')">Approve Access</v-btn>
                    <v-btn color="error" variant="tonal" size="small" rounded="lg" @click="processKYC(user.uid, 'rejected')">Reject</v-btn>
                  </div>
                </td>
              </tr>
              <tr v-if="pendingVerifications.length === 0">
                <td colspan="3" style="text-align: center; padding: 60px; color: var(--text-muted);">
                   <v-icon size="48" color="grey-lighten-3" class="mb-4">mdi-account-check-outline</v-icon>
                   <div style="font-size: 14px;">The identity queue is perfectly balanced. No pending screenings.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Proposals Tab -->
      <div v-if="tab === 'proposals'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text-primary); margin: 0; font-weight: 400;">P2P Proposals</h2>
              <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Community submitted assets awaiting floor access</p>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;" class="clean-table">
            <thead>
              <tr>
                <th style="padding: 16px 24px; text-align: left; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);">Asset & Seller</th>
                <th style="padding: 16px 24px; text-align: right; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);">Start Price</th>
                <th style="padding: 16px 24px; text-align: center; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);">Status</th>
                <th style="padding: 16px 24px; text-align: right; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color);">Review</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in pendingAuctions" :key="a.id" style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 16px 24px;">
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <v-avatar rounded="lg" size="48" color="grey-lighten-4">
                      <v-img :src="a.imageUrl || placeholder" cover></v-img>
                    </v-avatar>
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">{{ a.title }}</div>
                      <div style="font-size: 12px; color: var(--accent); font-weight: 600;">By {{ a.sellerName || 'Verified User' }}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <span style="font-weight: 700; color: var(--text-primary);">₹{{ a.minBid.toLocaleString() }}</span>
                </td>
                <td style="padding: 16px 24px; text-align: center;">
                  <v-chip size="x-small" color="orange" variant="flat" class="font-weight-black">REVIEW REQ</v-chip>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <v-btn icon="mdi-check" color="success" variant="tonal" size="x-small" @click="reviewProposal(a.id, true)"></v-btn>
                    <v-btn icon="mdi-close" color="error" variant="tonal" size="x-small" @click="reviewProposal(a.id, false)"></v-btn>
                  </div>
                </td>
              </tr>
              <tr v-if="pendingAuctions.length === 0">
                <td colspan="4" style="text-align: center; padding: 48px; color: var(--text-muted); font-size: 14px;">No community proposals currently in queue.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="tab === 'users'" class="animate-in animate-in-delay-2">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 24px; border-bottom: 1px solid var(--border-color); background: var(--bg-subtle);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0;">User Wealth Ledger</h2>
                <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0;">Managing account balances and membership statuses</p>
              </div>
              <v-chip color="accent" variant="tonal" size="small" class="font-weight-bold">{{ allUsers.length }} REGISTERED CURATORS</v-chip>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;" class="clean-table">
            <thead>
              <tr style="background: var(--bg-page);">
                <th style="padding: 16px 24px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Curator Identity</th>
                <th style="padding: 16px 24px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Wealth Ledger (₹)</th>
                <th style="padding: 16px 24px; text-align: center; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Verification</th>
                <th style="padding: 16px 24px; text-align: right; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Operations</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in allUsers" :key="user.uid" style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 16px 24px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <v-avatar color="primary" size="36" class="font-weight-bold" style="color: white !important;">{{ (user.username || 'U')[0].toUpperCase() }}</v-avatar>
                    <div>
                      <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">{{ user.username }}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <div style="font-size: 16px; font-weight: 800; color: var(--accent);">₹{{ (user.credits || 0).toLocaleString() }}</div>
                  <div v-if="user.heldCredits" style="font-size: 10px; color: var(--warning); font-weight: 700;">₹{{ user.heldCredits.toLocaleString() }} HELD (ESCROW)</div>
                </td>
                <td style="padding: 16px 24px; text-align: center;">
                  <v-chip :color="user.isVerified ? 'success' : 'warning'" variant="tonal" size="x-small" class="font-weight-black">
                    {{ user.isVerified ? 'VERIFIED' : 'UNVERIFIED' }}
                  </v-chip>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <v-btn color="primary" variant="tonal" size="small" class="rounded-lg font-weight-bold" @click="auditUser(user)">Audit Trace</v-btn>
                </td>
              </tr>
              <tr v-if="allUsers.length === 0">
                <td colspan="4" style="text-align: center; padding: 60px; color: var(--text-muted);">
                   <v-icon size="48" color="grey-lighten-3" class="mb-4">mdi-account-off-outline</v-icon>
                   <div style="font-size: 14px;">Market registry is empty. No active curators found.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Auction Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card class="rounded-xl pa-4" style="background: var(--bg-card); border: 1px solid var(--border-color);">
        <v-card-title class="d-flex justify-space-between align-center px-4">
          <span style="font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--text-primary);">Update Lot Details</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showEditDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text v-if="editingAuction">
          <v-row dense>
            <v-col cols="12">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Asset Title</label>
              <input v-model="editingAuction.title" type="text" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);" />
            </v-col>
            <v-col cols="12">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Description</label>
              <textarea v-model="editingAuction.description" style="width: 100%; min-height: 100px; resize: none; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);"></textarea>
            </v-col>
            <v-col cols="6">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Category</label>
              <select v-model="editingAuction.category" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </v-col>
            <v-col cols="6">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">End Time</label>
              <input v-model="editingAuction.endTime" type="datetime-local" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);" />
            </v-col>
            <v-col cols="12">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Image URL</label>
              <input v-model="editingAuction.imageUrl" type="text" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);" />
            </v-col>
            
            <v-col cols="6" v-if="editingAuction.bidCount === 0">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Min Bid (₹)</label>
              <input v-model="editingAuction.minBid" type="number" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);" />
            </v-col>
            <v-col cols="6" v-if="editingAuction.bidCount === 0">
              <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">Buy It Now (₹)</label>
              <input v-model="editingAuction.buyItNow" type="number" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-page); color: var(--text-primary);" />
            </v-col>
            <v-col cols="12" v-else>
              <div style="background: var(--bg-subtle); padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-muted); border-left: 4px solid var(--accent);">
                Bids detected ({{ editingAuction.bidCount }}). Pricing fields consolidated for fair play.
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEditDialog = false" style="color: var(--text-secondary);">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="rounded-lg px-6" :loading="submitting" @click="saveAuctionChanges">Sync Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- User Audit Dialog -->
    <v-dialog v-model="showAuditDialog" max-width="700">
      <v-card class="rounded-xl pa-0" style="background: var(--bg-card); border: 1px solid var(--border-color); overflow: hidden;">
        <div style="padding: 24px; background: var(--bg-subtle); border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div v-if="auditingUser">
              <div style="font-size: 11px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Forensic Audit Trail</div>
              <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0;">{{ auditingUser.username }}</h2>
            </div>
            <v-btn icon="mdi-close" variant="text" size="small" @click="showAuditDialog = false"></v-btn>
          </div>
        </div>
        
        <v-card-text class="pa-0" style="max-height: 500px; overflow-y: auto;">
          <div v-if="userAudit.length > 0">
            <div v-for="tx in userAudit" :key="tx.id" style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 16px;">
              <div :style="{ background: tx.amount < 0 ? 'var(--error-soft)' : 'var(--success-soft)', padding: '8px', borderRadius: '10px' }">
                <v-icon :color="tx.amount < 0 ? 'error' : 'success'" size="18">
                  {{ tx.amount < 0 ? 'mdi-minus-circle-outline' : 'mdi-plus-circle-outline' }}
                </v-icon>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">{{ tx.type.replace(/_/g, ' ') }}</div>
                <div style="font-size: 11px; color: var(--text-muted);">{{ new Date(tx.timestamp).toLocaleString() }} · Ref: {{ tx.auctionId || 'Platform' }}</div>
              </div>
              <div style="text-align: right;">
                <div :style="{ fontSize: '15px', fontWeight: '800', color: tx.amount < 0 ? 'var(--error)' : 'var(--success)' }">
                  {{ tx.amount < 0 ? '-' : '+' }}₹{{ Math.abs(tx.amount).toLocaleString() }}
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">Bal: ₹{{ tx.balanceAfter.toLocaleString() }}</div>
              </div>
            </div>
          </div>
          <div v-else style="padding: 60px; text-align: center; color: var(--text-muted);">
            <v-progress-circular v-if="submitting" indeterminate color="primary" class="mb-4"></v-progress-circular>
            <div v-else>No transaction history found for this curator.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'
import { useNotification } from '../services/notification'
import { Bar } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale 
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const authStore = useAuthStore()
const notification = useNotification()
const tab = ref('overview')
const auctions = ref([])
const pendingAuctions = ref([])
const allUsers = ref([])
const flaggedAuctions = ref([])
const claims = ref([])
const stats = ref({})
const submitting = ref(false)
const aiGenerating = ref(false)
const showEditDialog = ref(false)
const editingAuction = ref(null)
const showAuditDialog = ref(false)
const auditingUser = ref(null)
const userAudit = ref([])
const placeholder = 'https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=200'
const categories = ['Art', 'Watches', 'Vehicles', 'Electronics', 'Collectibles']

const pendingVerifications = computed(() => allUsers.value.filter(u => u.kycStatus === 'pending'))

const tabs = computed(() => [
  { value: 'overview', label: 'Command Center', icon: 'mdi-view-dashboard-outline', count: 0 },
  { value: 'auctions', label: 'Manage Floor', icon: 'mdi-gavel', count: auctions.value.length },
  { value: 'proposals', label: 'Proposals', icon: 'mdi-file-eye-outline', count: pendingAuctions.value.length },
  { value: 'verifications', label: 'Identity Queue', icon: 'mdi-shield-check-outline', count: pendingVerifications.value.length },
  { value: 'flagged', label: 'Security Alerts', icon: 'mdi-shield-alert-outline', count: flaggedAuctions.value.length },
  { value: 'disputes', label: 'Disputes', icon: 'mdi-alert-octagon-outline', count: claims.value.length },
  { value: 'analytics', label: 'Intelligence', icon: 'mdi-chart-box-outline', count: 0 },
  { value: 'users', label: 'User Directory', icon: 'mdi-account-group-outline', count: allUsers.value.length },
  { value: 'create', label: 'Deploy Lot', icon: 'mdi-plus-circle-outline', count: 0 },
])

const chartData = computed(() => ({
  labels: stats.value.timeSeries?.labels || [],
  datasets: [{
    label: 'Daily Sales (₹)',
    backgroundColor: '#6366f1',
    borderRadius: 6,
    data: stats.value.timeSeries?.values || []
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { font: { family: 'DM Sans' } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: 'DM Sans' } }
    }
  }
}

const newAuction = ref({ title: '', description: '', minBid: 0, buyItNow: null, imageUrl: '', category: 'Watches', endTime: new Date(Date.now() + 86400000).toISOString() })

const fetchData = async () => {
  try {
    const [aRes, pRes, uRes, fRes, dRes, sRes] = await Promise.all([
      api.get('/api/auctions'), 
      api.get('/api/admin/pendingAuctions'),
      api.get('/api/admin/users'),
      api.get('/api/admin/flagged'),
      api.get('/api/admin/disputes'),
      api.get('/api/admin/analytics')
    ])
    auctions.value = aRes.data
    pendingAuctions.value = pRes.data
    allUsers.value = uRes.data
    flaggedAuctions.value = fRes.data
    claims.value = dRes.data.filter(d => d.status === 'open')
    stats.value = sRes.data
  } catch (err) { console.error(err) }
}

const generateAIDescription = async () => {
  if (!newAuction.value.title) return
  aiGenerating.value = true
  try {
    const res = await api.post('/api/generateDescription', { itemName: newAuction.value.title, features: newAuction.value.category })
    newAuction.value.description = res.data.description
    notification.add('Description enriched with AI insights.', 'success')
  } catch {
    notification.add('AI Service temporarily offline.', 'error')
  } finally {
    aiGenerating.value = false
  }
}

const createAuction = async () => {
  if (!newAuction.value.title || !newAuction.value.minBid) return notification.add('Fill in all required fields', 'error')
  submitting.value = true
  try {
    await api.post('/api/auctions', newAuction.value)
    notification.add('Auction created successfully!', 'success')
    newAuction.value = { title: '', description: '', minBid: 0, buyItNow: null, imageUrl: '', category: 'Watches', endTime: new Date(Date.now() + 86400000).toISOString() }
    fetchData()
    tab.value = 'auctions'
  } catch { notification.add('Failed to create auction.', 'error') }
  finally { submitting.value = false }
}

const deleteAuction = async (id) => {
  if (!confirm('Delete this auction? This cannot be undone.')) return
  try {
    await api.delete(`/api/auctions/${id}`)
    notification.add('Auction deleted.', 'success')
    fetchData()
  } catch { notification.add('Failed to delete.', 'error') }
}

const closeAuction = async (id) => {
  if (!confirm('End this auction and notify the winner?')) return
  try {
    await api.post('/api/admin/closeAuction', { auctionId: id })
    notification.add('Auction ended. Winner notified.', 'success')
    fetchData()
  } catch { notification.add('Failed to close auction.', 'error') }
}

const resolveDispute = async (id, status, resolution) => {
  try {
    await api.post(`/api/admin/disputes/${id}/resolve`, { status, resolution })
    notification.add('Dispute settlement recorded.', 'success')
    fetchData()
  } catch { notification.add('Failed to resolve dispute.', 'error') }
}

const processKYC = async (uid, status) => {
  try {
    await api.post(`/api/admin/verifyKYC`, { uid, status })
    notification.add(`Application ${status}. Notification dispatched.`, "success")
    fetchData()
  } catch (err) {
    notification.add("Action failed. Try again.", "error")
  }
}

const reviewProposal = async (id, approved) => {
  try {
    await api.post('/api/admin/reviewAuction', { auctionId: id, approved })
    notification.add(approved ? 'Asset live on floor' : 'Proposal rejected', approved ? 'success' : 'info')
    fetchData()
  } catch {
    notification.add('Sync failure', 'error')
  }
}

const startEdit = (auction) => {
  editingAuction.value = JSON.parse(JSON.stringify(auction))
  if (editingAuction.value.endTime) {
    editingAuction.value.endTime = new Date(editingAuction.value.endTime).toISOString().slice(0, 16)
  }
  showEditDialog.value = true
}

const saveAuctionChanges = async () => {
  if (!editingAuction.value.title) return notification.add('Title is mandatory', 'error')
  submitting.value = true
  try {
    await api.put(`/api/auctions/${editingAuction.value.id}`, editingAuction.value)
    notification.add('Auction coordinates synchronized.', 'success')
    showEditDialog.value = false
    fetchData()
  } catch {
    notification.add('Synchronization failure.', 'error')
  } finally {
    submitting.value = false
  }
}

const auditUser = async (userOrPid, usernameFallback = 'Curator') => {
  const uid = typeof userOrPid === 'string' ? userOrPid : userOrPid.uid
  const username = typeof userOrPid === 'string' ? usernameFallback : userOrPid.username
  auditingUser.value = { uid, username }
  showAuditDialog.value = true
  userAudit.value = []
  submitting.value = true
  try {
    const res = await api.get(`/api/admin/users/${uid}/audit`)
    userAudit.value = res.data
  } catch {
    notification.add('Forensic link failure.', 'error')
  } finally {
    submitting.value = false
  }
}

watch(() => authStore.user, (newVal) => {
  if (newVal && newVal.role === 'admin') {
    fetchData()
  }
}, { immediate: true })

onMounted(() => {
  if (authStore.user && authStore.user.role === 'admin') {
    fetchData()
  }
})
</script>