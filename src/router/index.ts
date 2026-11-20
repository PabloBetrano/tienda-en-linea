import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    { path: '/ingresar', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true } },
    { path: '/registro', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },
    { path: '/recuperar', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { guest: true } },
    { path: '/actualizar-contrasena', component: () => import('@/views/auth/UpdatePasswordView.vue'), meta: { auth: true } },
    {
      path: '/tienda',
      component: () => import('@/layouts/StorefrontLayout.vue'),
      children: [
        { path: '', component: () => import('@/views/store/StoreView.vue') },
        { path: 'carrito', component: () => import('@/views/store/CartView.vue') },
        { path: 'mis-pedidos', component: () => import('@/views/store/MyOrdersView.vue'), meta: { auth: true } },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { auth: true, admin: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'productos', component: () => import('@/views/admin/ProductsView.vue') },
        { path: 'categorias', component: () => import('@/views/admin/CategoriesView.vue') },
        { path: 'pedidos', component: () => import('@/views/admin/OrdersView.vue') },
        { path: 'clientes', component: () => import('@/views/admin/CustomersView.vue') },
        { path: 'configuracion', component: () => import('@/views/admin/SettingsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  if (to.meta.auth && !auth.isAuthenticated) return { path: '/ingresar', query: { redirect: to.fullPath } }
  if (to.meta.admin && !auth.isAdmin) return '/tienda'
  if (to.meta.guest && auth.isAuthenticated) return auth.isAdmin ? '/admin' : '/tienda'
})

export default router
