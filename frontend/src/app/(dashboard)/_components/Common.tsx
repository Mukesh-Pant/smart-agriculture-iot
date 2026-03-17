const BackendDomain = "http://localhost:5000"

const BackendApi = {
    Onboarding: {
        url : `${BackendDomain}/api/userOnboarding`,
        method : "post"
    },
    SettingCookies: {
        url : `${BackendDomain}/api/settingCookies`,
        method : "get"
    }


}

export default BackendApi