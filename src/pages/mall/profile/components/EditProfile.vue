<script setup lang="ts">
import defaultAvatar from "@@/assets/images/user/default-mall-avatar.png"
import { ElMessage } from 'element-plus'
import { getFullUrl } from '@/common/apis/request'
import { getCurrentUserApi } from '@/common/apis/users'
import { useUserStore } from "@/pinia/stores/user"
import { userApi } from '../apis'


const userStore = useUserStore()
const visible = ref(false)
const loading = ref(false)
const pwdFormRef = ref()
const userFormRef = ref()

const userForm = reactive({
  id: 0,
  username: '',
  phone: '',
  email: '',
})

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 唤起弹窗并初始化数据
async function open() {
  visible.value = true
  const res: any = await getCurrentUserApi()
  userForm.id = res.data.id
  userForm.username = userStore.username
  userForm.phone = res.data.phone || ''
  userForm.email = res.data.email || ''
}
defineExpose({ open })

// --- 头像上传 ---
async function handleAvatarChange (uploadFile: any) {
  const file = uploadFile.raw
  if (!file) return

  loading.value = true
  try {
    const res: any = await userApi.uploadAvatar(userForm.id, file)
    if (res.code === 200) {
      ElMessage.success('头像上传成功')
      location.reload()
    }
  } finally {
    loading.value = false
  }
}

// --- 保存基础资料 ---
async function saveBaseInfo () {
  try {
    await userFormRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const res: any = await userApi.updateUserInfo(userForm)
    if (res.code === 200) {
      ElMessage.success('个人资料更新成功，请重新登录')
      userStore.logout()
      visible.value = false
      location.reload()
    }else {
      ElMessage.error(res.message || '更新失败')
    }
  } finally {
    loading.value = false
  }
}

// --- 基础资料校验规则 ---
const userRules = {
  username: [
    { required: true, message: '昵称不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { pattern: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// --- 修改密码 ---
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '新密码至少6位', trigger: 'blur' }],
  confirmPassword: [{
    validator: (rule: any, value: any, callback: any) => {
      if (value !== pwdForm.newPassword) callback(new Error('两次输入密码不一致'))
      else callback()
    }, trigger: 'blur'
  }]
}

async function savePassword() {
  // 先进行表单前端校验
  try {
    await pwdFormRef.value.validate()
  } catch (err) {
    console.warn('表单校验失败', err)
    return
  }

  loading.value = true

  try {
    const res: any = await userApi.updatePassword(pwdForm)

    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      userStore.logout()
      location.reload()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '原密码输入错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="个人设置" width="600px" append-to-body destroy-on-close>
    <el-tabs tab-position="left" class="edit-tabs" v-loading="loading">

      <el-tab-pane label="基础信息">
        <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px" class="pt-4">
          <el-form-item label="用户头像">
            <el-upload
              class="avatar-wrapper"
              action="#"
              accept="image/*"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
            >
              <img v-if="userStore.userAvatar" :src="getFullUrl(userStore.userAvatar)" class="avatar-preview">
              <img v-else :src="defaultAvatar" class="avatar-placeholder">
              <div class="avatar-mask">更换头像</div>
            </el-upload>
          </el-form-item>

          <el-form-item label="用户昵称" prop="username">
            <el-input v-model="userForm.username" />
          </el-form-item>

          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="userForm.phone" placeholder="演示：直接修改" />
          </el-form-item>

          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="演示：直接修改" />
          </el-form-item>

          <div class="flex justify-end mt-4">
            <el-button type="primary" @click="saveBaseInfo">保存所有资料</el-button>
          </div>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="安全设置">
        <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="100px" class="pt-4">
          <el-form-item label="原密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwdForm.newPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
          </el-form-item>
          <div class="flex justify-end mt-4">
            <el-button type="danger" @click="savePassword">确认修改密码</el-button>
          </div>
        </el-form>
      </el-tab-pane>

    </el-tabs>
  </el-dialog>
</template>

<style scoped>
.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #f0f0f0;
  cursor: pointer;
  background: #f5f7fa;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
}

.avatar-wrapper :deep(.el-upload) {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}

.avatar-preview, .avatar-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}

.edit-tabs :deep(.el-tabs__content) {
  padding: 0 30px;
}
</style>
