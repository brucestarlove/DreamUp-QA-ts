import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync, mkdirSync, appendFileSync } from 'fs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameUrl, config, llm, model, headed, retries } = body

    if (!gameUrl) {
      return NextResponse.json(
        { error: 'Game URL is required' },
        { status: 400 }
      )
    }

    // Build CLI arguments
    const args = ['run', 'src/cli.ts', 'test', gameUrl]
    
    if (config) {
      // If config doesn't start with 'configs/', prepend it
      const configPath = config.startsWith('configs/') ? config : `configs/${config}`
      args.push('-c', configPath)
    }
    
    if (headed) {
      args.push('--headed')
    }
    
    if (retries) {
      args.push('--retries', retries.toString())
    }
    
    if (llm) {
      args.push('--llm')
    }
    
    if (model) {
      args.push('--model', model)
    }

    // Log the command being executed
    console.log('[API] Starting test with command:', 'bun', args.join(' '))

    // Create logs directory if it doesn't exist
    const logsDir = join(process.cwd(), 'logs')
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true })
    }

    // Create log file for this spawn process
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const logFile = join(logsDir, `spawn-${timestamp}.log`)
    
    // Log the spawn command
    appendFileSync(logFile, `[${new Date().toISOString()}] Spawning: bun ${args.join(' ')}\n`)
    appendFileSync(logFile, `[${new Date().toISOString()}] CWD: ${process.cwd()}\n`)
    appendFileSync(logFile, `[${new Date().toISOString()}] Game URL: ${gameUrl}\n`)

    // Spawn the CLI process with piped stdio to capture output
    const cliProcess = spawn('bun', args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout and stderr
      detached: true, // Allow process to continue after API response
      env: { ...process.env }, // Inherit environment variables
    })

    // Capture stdout
    cliProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      appendFileSync(logFile, `[STDOUT] ${output}`)
      console.log('[CLI Output]', output.trim())
    })

    // Capture stderr
    cliProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      appendFileSync(logFile, `[STDERR] ${output}`)
      console.error('[CLI Error]', output.trim())
    })

    // Handle process exit
    cliProcess.on('exit', (code, signal) => {
      const exitMsg = `Process exited with code ${code}, signal ${signal}\n`
      appendFileSync(logFile, `[${new Date().toISOString()}] ${exitMsg}`)
      console.log('[CLI Process]', exitMsg.trim())
    })

    // Handle spawn errors
    cliProcess.on('error', (error) => {
      const errorMsg = `Spawn error: ${error.message}\n`
      appendFileSync(logFile, `[${new Date().toISOString()}] ${errorMsg}`)
      console.error('[CLI Spawn Error]', error)
    })

    // Wait a brief moment to catch immediate spawn errors
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if process is still running
    if (cliProcess.killed) {
      return NextResponse.json(
        { error: 'Failed to start test - process died immediately', logFile },
        { status: 500 }
      )
    }

    // Unref so the Node.js process doesn't wait for the child
    cliProcess.unref()

    // Return immediately - the test will run in the background
    // The SSE watch endpoint will notify when the session is created
    return NextResponse.json({
      success: true,
      message: 'Test started in background',
      pid: cliProcess.pid,
      logFile,
      command: `bun ${args.join(' ')}`,
    })
  } catch (error) {
    console.error('Error running test:', error)
    return NextResponse.json(
      { error: 'Failed to start test', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

