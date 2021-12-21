import { Module } from 'vuex'
import { PICX_MANAGEMENT } from '@/common/model/localStorage.model'
import DirImageListStateTypes from './types'
import RootStateTypes from '../../types'
import { createDirObject } from '@/store/modules/dir-image-list/utils'

const initDirImageList = () => {
  const dirImageList = localStorage.getItem(PICX_MANAGEMENT)
  return dirImageList ? JSON.parse(dirImageList) : []
}

const dirImageListModule: Module<DirImageListStateTypes, RootStateTypes> = {
  state: {
    name: 'dirImageListModule',
    dirImageList: initDirImageList()
  },

  mutations: {},

  actions: {
    // 图床管理 - 增加目录
    DIR_IMAGE_LIST_ADD_DIR({ state, dispatch }, dirPath: string) {
      const dirList: string[] = dirPath.split('/')
      let dirPathC = ''
      let targetDirObj_l1 = null
      let targetDirObj_l2 = null

      // eslint-disable-next-line no-plusplus
      for (let i = 0, len = dirList.length; i < len; i++) {
        const dirName = dirList[i]
        dirPathC += `${i > 0 ? '/' : ''}${dirName}`
        if (i === 0) {
          if (!state.dirImageList.some((v: any) => v.dir === dirList[0])) {
            state.dirImageList.push(createDirObject(dirName, dirPathC))
          }
        } else if (i === 1) {
          targetDirObj_l1 = state.dirImageList.find((v: any) => v.dir === dirList[0])
          if (
            targetDirObj_l1 &&
            !targetDirObj_l1.childrenDirs.some((v: any) => v.dir === dirList[1])
          ) {
            targetDirObj_l1.childrenDirs.push(createDirObject(dirName, dirPathC))
          }
        } else if (i === 2) {
          if (targetDirObj_l1) {
            targetDirObj_l2 = targetDirObj_l1.childrenDirs.find(
              (v: any) => v.dir === dirList[1]
            )
            if (
              targetDirObj_l2 &&
              !targetDirObj_l2.childrenDirs.some((v: any) => v.dir === dirList[2])
            ) {
              targetDirObj_l2.childrenDirs.push(createDirObject(dirName, dirPathC))
            }
          }
        }
      }

      dispatch('DIR_IMAGE_LIST_PERSIST')
    },

    // 图床管理 - 增加图片
    async DIR_IMAGE_LIST_ADD_IMAGE({ state, dispatch }, item: any) {
      const { dir } = item

      if (dir === '/' && !state.dirImageList.some((v: any) => v.name === item.name)) {
        state.dirImageList.push(item)
        dispatch('DIR_IMAGE_LIST_PERSIST')
        return
      }

      const dirList: string[] = dir.split('/')
      const targetDirObj_l1 = state.dirImageList.find((v: any) => v.dir === dirList[0])

      const tempFn = () => {
        if (
          dirList.length === 1 &&
          !targetDirObj_l1.imageList.some((v: any) => v.name === item.name)
        ) {
          targetDirObj_l1.imageList.push(item)
          dispatch('DIR_IMAGE_LIST_PERSIST')
          return
        }

        const targetDirObj_l2 = targetDirObj_l1.childrenDirs.find(
          (v: any) => v.dir === dirList[1]
        )

        if (
          dirList.length === 2 &&
          !targetDirObj_l2.imageList.some((v: any) => v.name === item.name)
        ) {
          targetDirObj_l2.imageList.push(item)
          dispatch('DIR_IMAGE_LIST_PERSIST')
          return
        }

        const targetDirObj_l3 = targetDirObj_l2.childrenDirs.find(
          (v: any) => v.dir === dirList[2]
        )
        if (
          dirList.length === 3 &&
          !targetDirObj_l3.imageList.some((v: any) => v.name === item.name)
        ) {
          targetDirObj_l3.imageList.push(item)
          dispatch('DIR_IMAGE_LIST_PERSIST')
        }
      }

      if (!targetDirObj_l1) {
        dispatch('DIR_IMAGE_LIST_ADD_DIR', dir).then(() => {
          tempFn()
        })
      } else {
        tempFn()
      }
    },

    // 图床管理 - 删除目录
    DIR_IMAGE_LIST_REMOVE_DIR({ state, dispatch }, dir: string) {
      if (state.dirImageList.some((v: any) => v.dir === dir)) {
        const rmIndex = state.dirImageList.findIndex((v: any) => v.dir === dir)
        // 删除目录
        state.dirImageList.splice(rmIndex, 1)
        dispatch('DIR_IMAGE_LIST_PERSIST')
      }
    },

    // 图床管理 - 删除指定目录里的指定图片
    DIR_IMAGE_LIST_REMOVE({ state, dispatch }, item: any) {
      if (state.dirImageList.length > 0) {
        const temp = state.dirImageList.find((v: any) => v.dir === item.dir)
        if (temp) {
          const rmIndex = temp.imageList.findIndex((v: any) => v.uuid === item.uuid)
          if (rmIndex !== -1) {
            // 删除图片
            temp.imageList.splice(rmIndex, 1)

            // 如果 imageList.length 为 0，需删除该目录
            if (temp.imageList.length === 0) {
              // userConfigInfo.dirList 中删除目录
              dispatch('DIR_IMAGE_LIST_REMOVE_DIR', temp.dir)

              // dirImageList 中删除目录
              dispatch('USER_CONFIG_INFO_REMOVE_DIR', temp.dir)
            }
            dispatch('DIR_IMAGE_LIST_PERSIST')
          }
        }
      }
    },

    // 图床管理 - 持久化存储
    DIR_IMAGE_LIST_PERSIST({ state }) {
      localStorage.setItem(PICX_MANAGEMENT, JSON.stringify(state.dirImageList))
    },

    // 图床管理 - 退出登录
    DIR_IMAGE_LOGOUT({ state }) {
      state.dirImageList = []
    }
  },

  getters: {
    getDirImageList: (state: any) => state.dirImageList
  }
}

export default dirImageListModule
