# AGENTS_DESIGN.md - Lineamientos de Diseño UI/UX

> Este archivo contiene TODOS los lineamientos de diseño visual y experiencia de usuario. Todo agente de IA que modifique la UI DEBE leer y seguir este documento al pie de la letra.

## ⚠️ REGLAS CRÍTICAS

| Regla | Descripción |
|-------|-------------|
| **1** | Usar componentes de **shadcn/ui nativos** sin modificaciones |
| **2** | **PROHIBIDO** el glassmorphism (backdrop-blur, fondos translúcidos, etc.) |
| **3** | Usar **variables CSS del tema** exclusivamente (NO colores hardcodeados) |
| **4** | **NO modificar** archivos en `components/ui/` |

---

---

## 🎨 Sistema de Colores

### Principio Fundamental
**NUNCA hardcodear colores.** Siempre usar las variables CSS del tema.

```css
/* ✅ CORRECTO - Usar variables del tema */
bg-primary              text-primary-foreground
bg-secondary            text-secondary-foreground
bg-destructive          text-destructive-foreground
bg-muted                text-muted-foreground
bg-accent               text-accent-foreground
bg-popover              text-popover-foreground
bg-card                 text-card-foreground
bg-background           text-foreground
border-border

/* ❌ PROHIBIDO - Colores hardcodeados */
bg-red-500, bg-blue-600, bg-green-500
text-gray-400, text-slate-700
bg-white, bg-black, bg-[#hex]
```

### Estados Específicos

#### Error / Destructivo
```tsx
// Mensajes de error
className="bg-destructive/10 border-destructive/20 text-destructive"

// Botón destructivo
<Button variant="destructive">Eliminar</Button>

// Acción destructiva sutil
className="text-destructive hover:bg-destructive/10"
```

#### Éxito / Confirmación
```tsx
// Indicadores de éxito (SOLO para estados, no para branding)
className="bg-emerald-500/10 text-emerald-500"
className="text-green-600"
```

#### Estados de Hover y Focus
```tsx
// Hover sutil
className="hover:bg-accent hover:text-accent-foreground"

// Focus rings (automático en shadcn, no modificar)
// El focus-visible está configurado globalmente
```

---

## 🔤 Tipografía

### Jerarquía de Textos

```tsx
// Título de página (solo uno por página)
<h1 className="text-2xl font-bold tracking-tight">

// Título de sección
<h2 className="text-lg font-semibold">

// Subtítulo de sección
<h3 className="text-base font-medium">

// Texto de cuerpo principal
<p className="text-sm">

// Texto secundario / descripción
<p className="text-sm text-muted-foreground">

// Texto pequeño / ayuda / captions
<p className="text-xs text-muted-foreground">
```

### Pesos de Fuente

```tsx
font-normal    // Texto regular
font-medium    // Énfasis ligero
font-semibold  // Subtítulos, labels
font-bold      // Títulos, números importantes
```

### Convenciones de Texto

- **Labels de formularios**: `text-sm font-medium`
- **Placeholders**: Color automático (no modificar)
- **Texto deshabilitado**: `opacity-50` o `text-muted-foreground`
- **Links**: `text-primary hover:underline`

---

## 📐 Espaciado y Layout

### Unidades de Espaciado

```tsx
// Gap entre elementos relacionados (inputs en form, items en lista)
gap-2    // 0.5rem - Muy cercanos
gap-3    // 0.75rem - Cercanos
gap-4    // 1rem - Relacionados (default)
gap-6    // 1.5rem - Secciones

// Padding interno
p-3      // Inputs, badges pequeños
p-4      // Cards, contenido compacto
p-6      // Modales, cards principales

// Padding de página/contenedor
px-4     // Mobile padding horizontal
px-6     // Desktop padding horizontal
py-4     // Espaciado vertical estándar
```

### Contenedores

```tsx
// Página completa
<div className="min-h-screen bg-background">

// Contenedor centrado con máximo ancho
<div className="max-w-5xl mx-auto px-4 md:px-6">

// Contenedor de ancho completo
<div className="w-full px-4 md:px-6">

// Stack vertical
<div className="flex flex-col gap-4">

// Stack horizontal
<div className="flex items-center gap-4">
```

### Responsive Design

```tsx
// Mobile-first (default es mobile)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="text-sm md:text-base"
className="px-4 md:px-6"
className="hidden md:block"  // Ocultar en mobile
className="md:hidden"        // Mostrar solo en mobile
```

---

## 🧩 Componentes UI (shadcn/ui Nativos)

> **REGLA FUNDAMENTAL**: Usar componentes de shadcn/ui EXACTAMENTE como vienen. NO modificarlos, NO crear wrappers, NO agregar estilos personalizados que alteren su comportamiento nativo.

### Instalación de Componentes

```bash
# Usar SIEMPRE el CLI de shadcn
npx shadcn add button
npx shadcn add card
npx shadcn add dialog
# etc...
```

### Reglas Estrictas de Uso

```tsx
// ✅ CORRECTO - Usar componente exactamente como viene
import { Button } from "@/components/ui/button"
<Button variant="default">Click me</Button>

// ❌ PROHIBIDO - Modificar el componente base
const MyButton = ({ className, ...props }) => (
  <Button className={cn("shadow-lg", className)} {...props} />
)

// ❌ PROHIBIDO - Agregar estilos arbitrarios que alteren el diseño
<Button className="shadow-2xl backdrop-blur-md border-opacity-50">
  Click me
</Button>

// ❌ PROHIBIDO - Crear variantes custom innecesarias
<Button className="bg-gradient-to-r from-blue-500 to-purple-500">
  Click me
</Button>
```

### Botones

```tsx
// Primario (default)
<Button>Acción principal</Button>

// Secundario
<Button variant="secondary">Secundario</Button>

// Outline
<Button variant="outline">Cancelar</Button>

// Ghost (para acciones dentro de tablas/listas)
<Button variant="ghost">Editar</Button>

// Destructivo
<Button variant="destructive">Eliminar</Button>

// Estados
<Button disabled>Cargando...</Button>
<Button size="sm">Pequeño</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><Icon /></Button>

// Con icono + texto
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Nuevo
</Button>

// Como link
<Button asChild variant="link">
  <Link href="/ruta">Ver más</Link>
</Button>
```

### Formularios

> Usar los componentes de formulario de shadcn/ui sin modificaciones.

```tsx
// ✅ CORRECTO - Usar Input nativo
import { Input } from "@/components/ui/input"
<Input placeholder="Email" />

// ❌ PROHIBIDO - Modificar el Input con clases arbitrarias
<Input className="backdrop-blur bg-white/10 border-white/20" />

// Estructura de campo
<div className="grid gap-2">
  <Label htmlFor="email">Correo electrónico</Label>
  <Input id="email" type="email" placeholder="tu@email.com" />
  <p className="text-xs text-muted-foreground">
    Texto de ayuda opcional
  </p>
</div>

// Campo con error
<div className="grid gap-2">
  <Label htmlFor="email">Correo</Label>
  <Input id="email" error className="border-destructive" />
  <p className="text-xs text-destructive">Este campo es requerido</p>
</div>

// Grupo de campos en grid
<div className="grid grid-cols-2 gap-4">
  <div className="grid gap-2">...</div>
  <div className="grid gap-2">...</div>
</div>
```

### Cards

```tsx
// ✅ CORRECTO - Card nativa sin modificaciones
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Contenido</CardContent>
</Card>

// ❌ PROHIBIDO - Glassmorphism o modificaciones
<Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">

// ❌ PROHIBIDO - Gradientes personalizados
<Card className="bg-gradient-to-br from-gray-900 to-gray-800">
  <CardHeader>
    <CardTitle>Título de la Card</CardTitle>
    <CardDescription>Descripción opcional del contenido</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido principal */}
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancelar</Button>
    <Button>Guardar</Button>
  </CardFooter>
</Card>
```

### Modales / Dialogs

```tsx
// ✅ CORRECTO - Dialog nativo
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>

// ❌ PROHIBIDO - Modificar el overlay o content con glassmorphism
<DialogContent className="bg-white/80 backdrop-blur-xl">
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Modal</DialogTitle>
      <DialogDescription>
        Descripción de lo que va a pasar
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Contenido */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tablas

```tsx
// ✅ CORRECTO - Table nativa
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>

// ❌ PROHIBIDO - Fondos translúcidos o glassmorphism
<Table className="bg-white/5 backdrop-blur">
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right">Acciones</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">Item 1</TableCell>
      <TableCell>
        <Badge variant="secondary">Activo</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">Editar</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badges

```tsx
// Estados comunes
<Badge>Default</Badge>
<Badge variant="secondary">Secundario</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>

// Para estados personalizados
<Badge className="bg-emerald-500/10 text-emerald-500">Éxito</Badge>
<Badge className="bg-amber-500/10 text-amber-500">Pendiente</Badge>
```

### Avatares

```tsx
<Avatar>
  <AvatarImage src="https://..." alt="Usuario" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Tamaños
<Avatar className="h-8 w-8" />   // Pequeño
<Avatar className="h-10 w-10" />  // Default
<Avatar className="h-12 w-12" />  // Grande
```

### Toasts / Notificaciones

```tsx
import { toast } from "sonner"

// Éxito
toast.success("Operación completada")

// Error
toast.error("Algo salió mal")

// Info
toast.info("Información importante")

// Con descripción
toast.success("Perfil actualizado", {
  description: "Tus cambios se han guardado correctamente"
})

// Con acción
toast.error("Error de conexión", {
  action: {
    label: "Reintentar",
    onClick: () => retry()
  }
})
```

---

## 🚫 Prohibido: Glassmorphism / Efectos de Vidrio

### Qué está PROHIBIDO

```tsx
// ❌ NUNCA usar backdrop-blur
className="backdrop-blur"
className="backdrop-blur-md"
className="backdrop-blur-lg"
className="backdrop-blur-xl"

// ❌ NUNCA usar fondos semi-transparentes
className="bg-white/10"
className="bg-white/20"
className="bg-black/30"
className="bg-background/50"
className="bg-primary/10"  // Excepto para estados específicos como hover

// ❌ NUNCA bordes semi-transparentes
className="border-white/20"
className="border-white/10"
className="border-opacity-50"

// ❌ NUNCA sombras difusas estilo glassmorphism
className="shadow-2xl"
className="shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"

// ❌ NUNCA gradientes de fondo personalizados
className="bg-gradient-to-r from-purple-500 to-pink-500"
className="bg-gradient-to-br from-gray-900 via-gray-800 to-black"

// ❌ NUNCA overlays con opacidad sobre contenido
<div className="absolute inset-0 bg-black/50 backdrop-blur-sm">
```

### Qué SÍ está permitido

```tsx
// ✅ Fondos sólidos con variables del tema
className="bg-background"
className="bg-card"
className="bg-muted"
className="bg-primary"

// ✅ Bordes opacos con variables del tema
className="border-border"

// ✅ Sombras sutiles nativas de shadcn
className="shadow-sm"  // Muy sutil
className="shadow"     // Default (ya viene en Card)

// ✅ Colores con opacidad SOLO para estados específicos
className="bg-destructive/10"  // Para mensajes de error
className="bg-emerald-500/10"  // Para indicadores de éxito
className="hover:bg-accent"    // Para estados hover
```

### Por qué prohibimos el glassmorphism

1. **Inconsistencia**: No todos los navegadores soportan `backdrop-filter` igual
2. **Accesibilidad**: Reduce el contraste y dificulta la lectura
3. **Performance**: `backdrop-blur` es costoso en renderizado
4. **Diseño**: El proyecto usa un diseño flat/moderno sin efectos de vidrio

---

## 🧩 Componentes Personalizados

### Regla de Oro

Si necesitas un comportamiento diferente a los componentes nativos de shadcn:

1. **Primero**: Verifica si hay una variante nativa que cumpla tu necesidad
2. **Segundo**: Combinar componentes nativos (composición)
3. **Último recurso**: Crear componente nuevo en `components/` (NO modificar `components/ui/`)

### Estructura de Componentes Personalizados

```tsx
// ✅ CORRECTO - Componente personalizado que USA shadcn internamente
// components/my-custom-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MyCustomCard({ title, status, children }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge>{status}</Badge>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ❌ PROHIBIDO - Modificar archivos en components/ui/
// No editar: components/ui/button.tsx, components/ui/card.tsx, etc.
```

---

## 🌗 Modo Oscuro

### Principio
El modo oscuro está HABILITADO por defecto. Todos los componentes deben funcionar en ambos modos usando variables CSS.

```tsx
// ✅ CORRECTO - Se adapta automáticamente
className="bg-background text-foreground"
className="border-border"
className="bg-muted text-muted-foreground"
className="bg-card text-card-foreground"

// ❌ PROHIBIDO - No se adapta al tema
className="bg-white text-black"
className="bg-[#0a0a0a] text-white"
className="bg-gray-100 text-gray-900"
```

### Testing Visual
- Siempre verificar que los componentes se vean bien en AMBOS modos
- Usar el toggle de tema para probar
- No asumir que "oscuro = negro" o "claro = blanco"

---

## 🎯 Patrones de UI Comunes

### Página de Dashboard

```tsx
<div className="min-h-screen bg-background">
  {/* Header */}
  <header className="border-b bg-background">
    <div className="flex h-16 items-center px-4 md:px-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>
    </div>
  </header>
  
  {/* Contenido */}
  <main className="p-4 md:p-6">
    <div className="grid gap-6">
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>...</Card>
        <Card>...</Card>
        <Card>...</Card>
      </div>
      
      {/* Tabla o contenido principal */}
      <Card>...</Card>
    </div>
  </main>
</div>
```

### Formulario de Edición

```tsx
<Card>
  <CardHeader>
    <CardTitle>Editar Perfil</CardTitle>
    <CardDescription>
      Actualiza tu información personal
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="firstName">Nombre</Label>
        <Input id="firstName" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Apellido</Label>
        <Input id="lastName" />
      </div>
    </div>
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" />
    </div>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancelar</Button>
    <Button>Guardar cambios</Button>
  </CardFooter>
</Card>
```

### Lista con Acciones

```tsx
<div className="space-y-2">
  {items.map((item) => (
    <div 
      key={item.id}
      className="flex items-center justify-between p-4 rounded-lg border bg-card"
    >
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{item.initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{item.role}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  ))}
</div>
```

### Estados de Carga

```tsx
// Skeleton para cards
<Card>
  <CardHeader>
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-1/2" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </CardContent>
</Card>

// Skeleton para tabla
<Table>
  <TableHeader>
    <TableRow>
      <TableHead><Skeleton className="h-4 w-20" /></TableHead>
      <TableHead><Skeleton className="h-4 w-20" /></TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {[1, 2, 3].map((i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Loading button
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Cargando...
</Button>
```

### Estados Vacíos

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <Inbox className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold">No hay elementos</h3>
  <p className="text-sm text-muted-foreground max-w-sm mt-2">
    Comienza creando tu primer elemento usando el botón de abajo
  </p>
  <Button className="mt-6">
    <Plus className="mr-2 h-4 w-4" />
    Crear elemento
  </Button>
</div>
```

---

## ♿ Accesibilidad

### Reglas Obligatorias

```tsx
// 1. TODOS los inputs deben tener label asociado
<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// 2. Botones de icono DEBEN tener aria-label
<Button size="icon" aria-label="Cerrar">
  <X className="h-4 w-4" />
</Button>

// 3. Imágenes deben tener alt
<img src="..." alt="Descripción de la imagen" />
<AvatarImage src="..." alt="Nombre del usuario" />

// 4. Estados de carga deben anunciarse
<div role="status" aria-live="polite">
  <span className="sr-only">Cargando...</span>
  <Spinner />
</div>

// 5. Contraste de colores
// Asegurar que text-muted-foreground tenga suficiente contraste
// Usar fondos adecuados para textos
```

### Navegación por Teclado

- Todos los elementos interactivos deben ser focusables
- El orden de tabulación debe ser lógico
- Debe haber indicador visual de focus (ring por defecto en shadcn)

---

## ✅ Checklist de UI/UX

Antes de entregar cualquier cambio de UI:

### Colores y Tema
- [ ] No hay colores hardcodeados (red-500, blue-600, white, black)
- [ ] Se usan variables CSS (--primary, --destructive, etc.)
- [ ] Funciona correctamente en modo claro
- [ ] Funciona correctamente en modo oscuro
- [ ] **NO hay glassmorphism** (backdrop-blur, bg-white/10, etc.)

### Tipografía
- [ ] Jerarquía visual clara (h1 > h2 > h3)
- [ ] Textos legibles (tamaños apropiados)
- [ ] Contraste suficiente entre texto y fondo

### Espaciado
- [ ] Espaciado consistente (gap-4, p-4, etc.)
- [ ] No hay elementos pegados sin espacio
- [ ] Márgenes apropiados en mobile y desktop

### Componentes (shadcn/ui Nativos)
- [ ] Botones usan variantes correctas (SIN modificaciones)
- [ ] Formularios usan Input, Label nativos de shadcn
- [ ] Modales usan Dialog nativo sin modificaciones
- [ ] Tablas usan Table nativa sin modificaciones
- [ ] Cards usan Card nativa sin modificaciones
- [ ] **NO se modifican los archivos en `components/ui/`**
- [ ] **NO se agregan clases arbitrarias a componentes de shadcn**

### Estados
- [ ] Estados de carga implementados (skeletons/spinners)
- [ ] Estados vacíos manejados
- [ ] Estados de error visibles y claros
- [ ] Estados deshabilitados correctos

### Responsive
- [ ] Se ve bien en mobile (320px+)
- [ ] Se ve bien en tablet (768px+)
- [ ] Se ve bien en desktop (1024px+)
- [ ] No hay overflow horizontal

### Accesibilidad
- [ ] Todos los inputs tienen labels
- [ ] Botones de icono tienen aria-label
- [ ] Imágenes tienen alt
- [ ] Contraste de colores suficiente (WCAG AA)
- [ ] Navegable por teclado

---

## 🚫 Anti-Patrones Prohibidos

```tsx
// ❌ NO usar glassmorphism / efectos de vidrio
className="backdrop-blur-md"
className="bg-white/10"
className="bg-white/20 border-white/10"
className="shadow-2xl"

// ❌ NO modificar componentes nativos de shadcn
<Button className="shadow-lg bg-gradient-to-r from-blue-500 to-purple-500">
<Card className="backdrop-blur bg-background/50">
<Input className="border-opacity-50">

// ❌ NO usar colores arbitrarios
className="bg-[#1a1a1a] text-[#fefefe]"

// ❌ NO mezclar unidades de espaciado inconsistentes
className="p-3 gap-4 mb-5" // Mezcla 3, 4, 5

// ❌ NO usar !important en clases
className="!bg-primary"

// ❌ NO hardcodear z-index arbitrarios
className="z-[9999]"

// ❌ NO usar width/height fijos innecesarios
className="w-[300px] h-[200px]"

// ❌ NO mezclar diferentes sistemas de grid/flex innecesariamente
className="flex grid-cols-3" // Contradictorio

// ❌ NO dejar textos sin estilar
<p>Sin clase</p> // Siempre aplicar clases de tipografía

// ❌ NO usar margen negativo para "hacks"
className="-mt-4"

// ❌ NO crear componentes duplicados de shadcn
// En lugar de crear tu propio botón, extiende el de shadcn
```

---

## 📚 Referencias Rápidas

### Clases más usadas por componente

| Elemento | Clases típicas |
|----------|---------------|
| Contenedor página | `min-h-screen bg-background` |
| Contenedor contenido | `max-w-5xl mx-auto px-4 md:px-6 py-6` |
| Stack vertical | `flex flex-col gap-4` |
| Stack horizontal | `flex items-center gap-4` |
| Grid 2 columnas | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| Card | `rounded-lg border bg-card text-card-foreground shadow-sm` |
| Texto secundario | `text-sm text-muted-foreground` |
| Hover interactivo | `hover:bg-accent hover:text-accent-foreground` |

### Iconos (lucide-react)

Tamaños estándar:
- `h-4 w-4` - Dentro de botones, inputs
- `h-5 w-5` - Navegación, headers
- `h-8 w-8` - Iconos grandes, estados vacíos

```tsx
import { 
  Plus, X, Check, ChevronDown, ChevronRight,
  Trash2, Edit, MoreHorizontal, Loader2,
  User, Settings, LogOut, Bell, Search,
  Folder, FileText, Home, BarChart3
} from "lucide-react"
```

---

## 💡 Principios de Diseño

1. **Consistencia**: Usar los mismos patrones en toda la aplicación
2. **Simplicidad**: Usar componentes nativos de shadcn/ui sin modificaciones
3. **Claridad**: La interfaz debe ser autoexplicativa
4. **Feedback**: Toda acción debe tener retroalimentación visual
5. **Restricción**: Prevenir errores antes de que ocurran
6. **Reconocimiento**: Reducir la carga de memoria del usuario
7. **Flexibilidad**: Adaptarse a diferentes tamaños de pantalla
8. **Estética**: Diseño flat, minimalista y profesional (SIN glassmorphism)

---

> **IMPORTANTE**: Este documento es la fuente de verdad para el diseño UI/UX. Cualquier desviación debe ser justificada y documentada.
