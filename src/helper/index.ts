import { filesystem, print } from 'gluegun'

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
    const mangoExist = gitignoreFile.split('\n').includes('.mango')
    if (mangoExist) {
      print.fancy('.mango is already in git ignored!')
    } else {
      gitignoreFile += `\n# Mango Cli\n.mango`
      await filesystem.writeAsync(__gitIgnoreFilePath, gitignoreFile)
      print.fancy('Added .mango to .gitignore!')
    }
  } else {
    // create a .gitignore file in the root directory
    gitignoreFile = `\n# Mango Cli\n.mango/`
    await filesystem.writeAsync(__gitIgnoreFilePath, gitignoreFile)
    print.fancy('Create .gitignore file and added .mango!!')
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
