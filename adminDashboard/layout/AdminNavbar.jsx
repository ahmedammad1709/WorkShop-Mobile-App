import profilePic from '../../../assets/images/profile.jpg'

function AdminNavbar() {
  return (
    <div className="bg-white px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 w-full">
      <div className="flex justify-end items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-semibold">Admin</span>
          <img src={profilePic} alt="Admin Profile" className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover" />
        </div>
      </div>
    </div>
  )
}

export default AdminNavbar