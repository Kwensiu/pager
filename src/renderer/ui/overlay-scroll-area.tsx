import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

type OverlayScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  viewportClassName?: string
  scrollbarClassName?: string
  thumbClassName?: string
  scrollbarSize?: number
  scrollbarVisibility?: 'hover' | 'always'
}

const OverlayScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  OverlayScrollAreaProps
>(
  (
    {
      className,
      children,
      viewportClassName,
      scrollbarClassName,
      thumbClassName,
      scrollbarSize = 10,
      scrollbarVisibility = 'hover',
      ...props
    },
    ref
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('group/overlay-scroll relative h-full overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn('h-full w-full rounded-[inherit]', viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <OverlayScrollBar
        orientation="vertical"
        size={scrollbarSize}
        visibility={scrollbarVisibility}
        className={scrollbarClassName}
        thumbClassName={thumbClassName}
      />
      <OverlayScrollBar
        orientation="horizontal"
        size={scrollbarSize}
        visibility={scrollbarVisibility}
        className={scrollbarClassName}
        thumbClassName={thumbClassName}
      />
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  )
)

OverlayScrollArea.displayName = 'OverlayScrollArea'

const OverlayScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
    size: number
    visibility: 'hover' | 'always'
    thumbClassName?: string
  }
>(({ className, orientation = 'vertical', size, visibility, thumbClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    style={orientation === 'vertical' ? { width: size } : { height: size }}
    className={cn(
      'flex touch-none select-none p-px transition-opacity duration-200 ease-out',
      visibility === 'hover' &&
        'opacity-0 group-hover/overlay-scroll:opacity-100 group-focus-within/overlay-scroll:opacity-100 data-[state=visible]:opacity-100',
      visibility === 'always' && 'opacity-100',
      orientation === 'vertical' && 'h-full border-l border-l-transparent',
      orientation === 'horizontal' && 'flex-col border-t border-t-transparent',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        'relative flex-1 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50',
        thumbClassName
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))

OverlayScrollBar.displayName = 'OverlayScrollBar'

export { OverlayScrollArea }
