import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { WEBSITE_TYPES, type WebsiteType, MODULE_DEFINITIONS, getWebsiteType } from '@/lib/website-types'
import * as LucideIcons from 'lucide-react'

interface WebsiteTypeSelectorProps {
  onSelect: (type: WebsiteType, enabledModules: string[]) => void
  onCancel?: () => void
  initialType?: string
  initialModules?: string[]
}

export function WebsiteTypeSelector({ onSelect, onCancel, initialType, initialModules }: WebsiteTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<WebsiteType | null>(
    initialType ? getWebsiteType(initialType) ?? null : null
  )
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    if (initialModules) {
      initialModules.forEach((m) => { initial[m] = true })
    }
    return initial
  })
  const [showModules, setShowModules] = useState(false)

  useEffect(() => {
    if (selectedType) {
      const newModules: Record<string, boolean> = {}
      selectedType.modules.forEach((m) => { newModules[m] = true })
      setEnabledModules(newModules)
    }
  }, [selectedType])

  const toggleModule = (key: string) => {
    setEnabledModules((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName]
    return Icon || LucideIcons.Box
  }

  const handleNext = () => {
    if (!selectedType) return
    const active = Object.entries(enabledModules).filter(([, v]) => v).map(([k]) => k)
    onSelect(selectedType, active)
  }

  const activeModuleCount = Object.values(enabledModules).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose your website type</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a platform type to get started</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {WEBSITE_TYPES.map((type) => {
          const Icon = getIcon(type.icon)
          const isSelected = selectedType?.id === type.id
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`group relative p-4 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg scale-105'
                  : 'border-muted hover:border-primary/30 hover:shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ backgroundColor: `${type.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: type.color }} />
              </div>
              <h3 className="font-semibold text-sm">{type.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
            </button>
          )
        })}
      </div>

      {selectedType && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{selectedType.name} — Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedType.modules.length > 0
                    ? `This type includes ${selectedType.modules.length} recommended modules. You can customize below.`
                    : 'Add modules to extend your platform functionality.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowModules(!showModules)}>
                {activeModuleCount} modules selected
              </Button>
            </div>

            {selectedType.defaultTemplate && (
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <span className="text-xs text-muted-foreground">Recommended template: </span>
                <span className="text-sm font-medium">{selectedType.defaultTemplate}</span>
              </div>
            )}

            {showModules && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(MODULE_DEFINITIONS).map((mod) => {
                  const Icon = getIcon(mod.icon)
                  const isOn = enabledModules[mod.key]
                  const isDefault = selectedType.modules.includes(mod.key)
                  return (
                    <button
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        isOn ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/30'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOn ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`w-4 h-4 ${isOn ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{mod.name}</span>
                          {isDefault && (
                            <span className="text-xs px-1.5 py-0.25 bg-primary/10 text-primary rounded">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{mod.description}</p>
                      </div>
                      {isOn && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Back</Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!selectedType || activeModuleCount === 0}
          className="gradient-bg text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
