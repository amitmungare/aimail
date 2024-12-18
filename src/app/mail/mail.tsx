'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import React from 'react'
import AccountSwitcher from './account-switcher'
import Sidebar from './sidebar'
import ThreadList from './thread-list'
import { ThreadDisplay } from './thread-display'
// import { useLocalStorage } from "usehooks-ts"


interface MailProps {
    defaultLayout: number[] | undefined
    defaultCollapsed?: boolean
    navCollapsedSize: number
}

const mail = ({
    defaultLayout = [20, 32, 48],
    defaultCollapsed = false,
    navCollapsedSize,
}: MailProps) => {


    //   const [done, setDone] = useLocalStorage('normalhuman-done', false)
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup direction='horizontal' onLayout={(sizes: number[]) => {
            }} className='items-stretch h-full min-h-screen'>
                <ResizablePanel defaultSize={defaultLayout[0]} collapsedSize={navCollapsedSize} collapsible={true}
                    minSize={15}
                    maxSize={40}
                    onCollapse={() => {
                        setIsCollapsed(true)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            true
                        )}`
                    }}
                    onResize={() => {
                        setIsCollapsed(false)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            false
                        )}`
                    }}
                    className={cn(
                        isCollapsed &&
                        "min-w-[50px] transition-all duration-300 ease-in-out"
                    )}>

                    <div className="flex flex-col h-full flex-1">
                        <div
                            className={cn(
                                "flex h-[52px] items-center justify-center",
                                isCollapsed ? "h-[52px]" : "px-2"
                            )}
                        >
                            <AccountSwitcher
                             isCollapsed={isCollapsed} 
                             />
                        </div>
                        <Separator />
                        <Sidebar isCollapsed={isCollapsed} />
                        <div className="flex-1"></div>
                        {/* <AskAI isCollapsed={isCollapsed} /> */}
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <Tabs defaultValue="inbox" 
                    // value={done ? 'done' : 'inbox'} 
                    onValueChange={tab => {
                        // if (tab === 'done') {
                        //     setDone(true)
                        // } else {
                        //     setDone(false)
                        // }
                    }}>
                        <div className="flex items-center px-4 py-2">
                            <h1 className="text-xl font-bold">Inbox</h1>
                            <TabsList className="ml-auto">
                                <TabsTrigger
                                    value="inbox"
                                    className="text-zinc-600 dark:text-zinc-200"
                                >
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger
                                    value="done"
                                    className="text-zinc-600 dark:text-zinc-200"
                                >
                                    Done
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <Separator />
                        {/* <SearchBar /> */}
                        <TabsContent value="inbox" className="m-0">
                            <ThreadList />
                        </TabsContent>
                        <TabsContent value="done" className="m-0">
                            <ThreadList />
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
                    <ThreadDisplay />
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider >
    )
}

export default mail