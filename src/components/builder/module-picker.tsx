import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Settings, Package } from 'lucide-react'
import { MODULE_DEFINITIONS, getWebsiteType, type WebsiteType } from '@/lib/website-types'
import * as LucideIcons from 'lucide-react'

interface ModulePickerProps {
  websiteType?: string
  initialModules?: string[]
  onChange?: (modules: string[]) => void
  disabledModules?: string[]
}

export function ModulePicker({ websiteType, initialModules = [], onChange, disabledModules = [] }: ModulePickerProps) {
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    initialModules.forEach((key) => { m[key] = true })
    disabledModules.forEach((key) => { m[key] = false })
    return m
  })

  useEffect(() => {
    if (websiteType) {
      const typeDef = getWebsiteType(websiteType)
      if (typeDef) {
        const m: Record<string, boolean> = {}
        typeDef.modules.forEach((key) => { m[key] = true })
        disabledModules.forEach((key) => { m[key] = false })
        setEnabledModules(m)
      }
    }
  }, [websiteType, disabledModules])

  const toggleModule = (key: string) => {
    if (disabledModules.includes(key)) return
    const newModules = { ...enabledModules, [key]: !enabledModules[key] }
    setEnabledModules(newModules)
    const active = Object.entries(newModules).filter(([, v]) => v).map(([k]) => k)
    onChange?.(active)
  }

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[iconName]
    return Icon || LucideIcons.Box
  }

  const activeModules = Object.entries(enabledModules).filter(([, v]) => v).map(([k]) => k)
  const typeDef: WebsiteType | undefined = websiteType ? getWebsiteType(websiteType) : undefined

  const recommendedModules = typeDef?.modules || []
  const allModuleEntries = Object.entries(MODULE_DEFINITIONS)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modules</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeModules.length} of {allModuleEntries.length} modules enabled
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {activeModules.length} active
        </Badge>
      </div>

      {typeDef && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-xs text-muted-foreground">Website type: </span>
          <span className="text-sm font-medium" style={{ color: typeDef.color }}>{typeDef.name}</span>
          <p className="text-xs text-muted-foreground mt-1">Recommended modules are highlighted</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allModuleEntries.map(([key, mod]) => {
          const Icon = getIcon(mod.icon)
          const isOn = enabledModules[key]
          const isRecommended = recommendedModules.includes(key)
          const isDisabled = disabledModules.includes(key)

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isOn ? 'ring-2 ring-primary/30 bg-primary/5' : 'hover:bg-muted/30'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleModule(key)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isOn ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Icon className={`w-4 h-4 ${isOn ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span>{mod.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isRecommended && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Recommended
                      </Badge>
                    )}
                    {isOn && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{mod.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {activeModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Active Modules Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeModules.map((key) => {
                const mod = MODULE_DEFINITIONS[key]
                if (!mod) return null
                const Icon = getIcon(mod.icon)
                return (
                  <Badge key={key} variant="default" className="px-3 py-1">
                    <Icon className="w-3 h-3 mr-1" />
                    {mod.name}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
