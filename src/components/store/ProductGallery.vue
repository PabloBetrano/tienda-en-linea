<script setup lang="ts">
const galleryItems = [
  { name: 'Camiseta de algodón', image: '01-camiseta-algodon.jpg' },
  { name: 'Camisa de lino', image: '02-camisa-lino.jpg' },
  { name: 'Pantalón chino', image: '03-pantalon-chino.jpg' },
  { name: 'Jeans rectos', image: '04-jeans-rectos.jpg' },
  { name: 'Vestido casual', image: '05-vestido-casual.jpg' },
  { name: 'Falda midi', image: '06-falda-midi.jpg' },
  { name: 'Chaqueta ligera', image: '07-chaqueta-ligera.jpg' },
  { name: 'Suéter tejido', image: '08-sueter-tejido.jpg' },
  { name: 'Pantalón deportivo', image: '09-pantalon-deportivo.jpg' },
  { name: 'Short de baño', image: '10-short-bano.jpg' },
  { name: 'Tenis urbanos', image: '11-tenis-urbanos.jpg' },
  { name: 'Gorra ajustable', image: '12-gorra-ajustable.jpg' },
  { name: 'Sombrero de ala ancha', image: '13-sombrero-ala-ancha.jpg' },
  { name: 'Bolso de mano', image: '14-bolso-mano.jpg' },
  { name: 'Mochila urbana', image: '15-mochila-urbana.jpg' },
  { name: 'Cinturón de lona', image: '16-cinturon-lona.jpg' },
  { name: 'Pulsera trenzada', image: '17-pulsera-trenzada.jpg' },
  { name: 'Collar con dijes', image: '18-collar-dijes.jpg' },
  { name: 'Bufanda ligera', image: '19-bufanda-ligera.jpg' },
  { name: 'Calcetines deportivos', image: '20-calcetines-deportivos.jpg' },
]
</script>

<template>
  <section id="galeria" aria-labelledby="gallery-title" class="scroll-mt-20 bg-white py-14 sm:py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h2 id="gallery-title" class="text-3xl font-semibold tracking-tight sm:text-5xl">
            Galería de productos
          </h2>
          <p class="mt-3 text-slate-600">Piezas de muestra de nuestra colección.</p>
        </div>
        <RouterLink to="/tienda" class="btn-secondary">Ver catálogo disponible</RouterLink>
      </div>
      <ul class="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
        <li v-for="item in galleryItems" :key="item.image">
          <figure>
            <img
              :src="`/demo-products/${item.image}`"
              alt=""
              width="480"
              height="480"
              loading="lazy"
              decoding="async"
              class="aspect-square w-full rounded-2xl bg-[#f3f3f5] object-cover"
            />
            <figcaption class="mt-3 text-sm font-semibold text-ink">{{ item.name }}</figcaption>
          </figure>
        </li>
      </ul>
    </div>
  </section>
</template>
