import { filesystem, print } from 'gluegun'
import { IConfig } from '../model'

export const fileExist = async (filePath: string): Promise<boolean> => {
  const file = await filesystem.existsAsync(filePath)
  return file === 'dir' || file === 'file'
}

export const upsertGitIgnore = async (): Promise<void> => {
  const __dirname = filesystem.cwd()
  let gitignoreFile = ''
  const __gitIgnoreFilePath = `${__dirname}/.gitignore`
  const gitIgnoreFileExist = await fileExist(__gitIgnoreFilePath)
  if (gitIgnoreFileExist) {
    gitignoreFile = await filesystem.readAsync(__gitIgnoreFilePath)
    const perskeExist = gitignoreFile.split('\n').includes('.perske')
    if (perskeExist) {
      print.fancy('.perske is already in git ignore!')
    } else {
      gitignoreFile += `\n# Perske Cli\n.perske`
      await filesystem.writeAsync(__gitIgnoreFilePath, gitignoreFile)
      print.fancy('Added .perske to .gitignore!')
    }
    const envExist = gitignoreFile.split('\n').includes('.env')
    if (envExist) {
      print.fancy('.env is already in git ignore!')
    } else {
      gitignoreFile += `\n# Env \n.env`
      await filesystem.writeAsync(__gitIgnoreFilePath, gitignoreFile)
      print.fancy('Added .env to .gitignore!')
    }
  } else {
    // create a .gitignore file in the root directory
    gitignoreFile = `\n# Perske Cli\n.perske\n.env`
    await filesystem.writeAsync(__gitIgnoreFilePath, gitignoreFile)
    print.fancy('Created .gitignore file and added .perske and .env!!')
  }
}

export const getOS = (): string => {
  switch (process.platform) {
    case 'win32':
      return 'windows'
    default:
      return 'linux'
  }
}

export const getConfigJSON = async (): Promise<IConfig> => {
  const __dirname = filesystem.cwd()
  const CONFIG_FILE_PATH = `${__dirname}/.perske/config.json`
  const config = await filesystem.readAsync(CONFIG_FILE_PATH)
  return JSON.parse(config)
}

export const getCopyCommand = async (
  homeDir: string,
  config: IConfig
): Promise<string> => {
  if (getOS() != 'windows') {
    return `cp -R ./${config.buildFolder} ${homeDir}/.perske/${config.buildFolder}`
  }
  return `xcopy .\\${config.buildFolder} ${homeDir}\\.perske\\${config.buildFolder} /E /I`
}
