/**
 * Utility tính toán & phân tích điểm phù hợp của Ứng viên với Tin tuyển dụng (JD Match Score)
 * Thang điểm chuẩn: 0 - 100 điểm
 */

export interface MatchScoreResult {
  score: number
  tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'LOW'
  tierLabel: string
  matchedTags: string[]
  missingTags: string[]
  summary: string
}

export function removeVietnameseTones(str: string): string {
  if (!str) return ''
  let s = str.trim().toLowerCase()
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  s = s.replace(/[đĐ]/g, 'd')
  return s
}

function parseExperienceYears(text?: string | null): number {
  if (!text) return 0
  const normalized = removeVietnameseTones(text)
  if (normalized.includes('khong yeu cau') || normalized.includes('chua co') || normalized.includes('fresher') || normalized.includes('moi tot nghiep')) {
    return 0
  }
  if (normalized.includes('duoi 1') || normalized.includes('< 1')) {
    return 0.5
  }
  if (normalized.includes('tren 5') || normalized.includes('> 5')) {
    return 6
  }
  if (normalized.includes('3 - 5') || normalized.includes('3-5') || normalized.includes('4')) {
    return 4
  }
  if (normalized.includes('1 - 3') || normalized.includes('1-3') || normalized.includes('1 - 2') || normalized.includes('1-2')) {
    return 2
  }
  const match = normalized.match(/(\d+(\.\d+)?)/)
  if (match) {
    return parseFloat(match[1])
  }
  return 1
}

export function calculateCandidateMatchScore(application: any, job: any): MatchScoreResult {
  if (!application) {
    return {
      score: 0,
      tier: 'LOW',
      tierLabel: 'Chưa có thông tin',
      matchedTags: [],
      missingTags: [],
      summary: 'Chưa đủ dữ liệu để đánh giá mức độ phù hợp.',
    }
  }

  // 1. KỸ NĂNG CHUYÊN MÔN (Tối đa 40 điểm)
  const candidateSkillsText = [
    application.skills || '',
    application.note || '',
    application.major || '',
    application.currentCompany || '',
  ].join(' ')
  const normCandidateSkills = removeVietnameseTones(candidateSkillsText)

  let jdTags: string[] = []
  if (Array.isArray(job?.skillTags) && job.skillTags.length > 0) {
    jdTags = job.skillTags.filter(Boolean)
  } else if (job?.name || job?.departmentName) {
    const tokens = `${job?.name || ''} ${job?.departmentName || ''}`
      .split(/[·•,\-\/]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2)
    jdTags = Array.from(new Set(tokens)).slice(0, 5)
  }

  const matchedTags: string[] = []
  const missingTags: string[] = []

  jdTags.forEach((tag) => {
    const normTag = removeVietnameseTones(tag)
    if (!normTag) return
    if (normCandidateSkills.includes(normTag)) {
      matchedTags.push(tag)
    } else {
      const words = normTag.split(' ').filter((w) => w.length > 2)
      const hasWordMatch = words.some((w) => normCandidateSkills.includes(w))
      if (hasWordMatch) {
        matchedTags.push(tag)
      } else {
        missingTags.push(tag)
      }
    }
  })

  let skillsScore = 0
  if (jdTags.length > 0) {
    const matchRatio = matchedTags.length / jdTags.length
    skillsScore = Math.round(matchRatio * 36)
    if (matchedTags.length > 0 && candidateSkillsText.length > 20) {
      skillsScore = Math.min(40, skillsScore + 4)
    }
    if (skillsScore === 0 && candidateSkillsText.trim().length > 10) {
      skillsScore = 15
    }
  } else {
    skillsScore = candidateSkillsText.trim().length > 15 ? 32 : 20
  }
  skillsScore = Math.max(0, Math.min(40, skillsScore))

  // 2. KINH NGHIỆM LÀM VIỆC (Tối đa 25 điểm)
  const candidateExpText = application.experienceYears || 'Chưa cập nhật'
  const requiredExpText = job?.experienceRequired || 'Không yêu cầu'
  const cExp = parseExperienceYears(candidateExpText)
  const rExp = parseExperienceYears(requiredExpText)

  let experienceScore = 0
  if (rExp === 0 || removeVietnameseTones(requiredExpText).includes('khong yeu cau')) {
    experienceScore = 25
  } else if (cExp >= rExp) {
    experienceScore = 25
  } else if (cExp >= rExp - 1) {
    experienceScore = 18
  } else if (cExp > 0) {
    experienceScore = 12
  } else {
    experienceScore = 8
  }

  // 3. ĐỊA ĐIỂM (Tối đa 15 điểm)
  const candidateCity = application.city || application.province || 'Chưa rõ'
  const jobCity = job?.province || job?.regionName || 'Toàn quốc'
  const normCandCity = removeVietnameseTones(candidateCity)
  const normJobCity = removeVietnameseTones(jobCity)

  let locationScore = 0
  if (
    normJobCity.includes('toan quoc') ||
    normJobCity.includes('linh hoat') ||
    !normJobCity ||
    normJobCity.includes('viet nam')
  ) {
    locationScore = 15
  } else if (normCandCity && (normCandCity.includes(normJobCity) || normJobCity.includes(normCandCity))) {
    locationScore = 15
  } else {
    const northCities = ['ha noi', 'hai phong', 'bac ninh', 'hung yen', 'quang ninh', 'vinh phuc', 'hai duong', 'nam dinh']
    const southCities = ['ho chi minh', 'hcm', 'sai gon', 'binh duong', 'dong nai', 'ba ria', 'can tho', 'long an']
    const candIsNorth = northCities.some((c) => normCandCity.includes(c))
    const jobIsNorth = northCities.some((c) => normJobCity.includes(c))
    const candIsSouth = southCities.some((c) => normCandCity.includes(c))
    const jobIsSouth = southCities.some((c) => normJobCity.includes(c))

    if ((candIsNorth && jobIsNorth) || (candIsSouth && jobIsSouth)) {
      locationScore = 11
    } else {
      locationScore = 7
    }
  }

  // 4. HỌC VẤN (Tối đa 10 điểm)
  const eduLevel = application.educationLevel || ''
  const uniName = application.university || ''
  const majorName = application.major || ''
  const normEdu = removeVietnameseTones(`${eduLevel} ${uniName}`)
  const normMajor = removeVietnameseTones(majorName)

  let educationScore = 6
  if (normEdu.includes('thac si') || normEdu.includes('tien si') || normEdu.includes('master')) {
    educationScore = 8
  } else if (normEdu.includes('dai hoc') || normEdu.includes('dh ') || normEdu.includes('hoc vien')) {
    educationScore = 8
  } else if (normEdu.includes('cao dang')) {
    educationScore = 6
  }

  const deptNorm = removeVietnameseTones(job?.departmentName || '')
  if (
    normMajor &&
    (normMajor.includes('cong nghe') ||
      normMajor.includes('ky thuat') ||
      normMajor.includes('kinh te') ||
      normMajor.includes('quan tri') ||
      normMajor.includes('marketing') ||
      (deptNorm && normMajor.includes(deptNorm)))
  ) {
    educationScore = Math.min(10, educationScore + 2)
  }

  // 5. ĐỘ HOÀN THIỆN HỒ SƠ (Tối đa 10 điểm)
  let completenessScore = 0
  const hasCv = Boolean(application.cvFileUrl)
  if (hasCv) completenessScore += 5
  if (application.phone && application.phone.trim().length >= 9) completenessScore += 2
  if (application.email && application.email.includes('@')) completenessScore += 2
  if (application.note || application.university || application.currentCompany) completenessScore += 1
  completenessScore = Math.min(10, completenessScore)

  // TỔNG ĐIỂM
  let totalScore = skillsScore + experienceScore + locationScore + educationScore + completenessScore
  totalScore = Math.max(0, Math.min(100, totalScore))

  if (typeof application.aiCvScore === 'number' && application.aiCvScore > 0) {
    totalScore = application.aiCvScore
  }

  let tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'LOW' = 'LOW'
  let tierLabel = 'Cần xem xét thêm'
  if (totalScore >= 80) {
    tier = 'EXCELLENT'
    tierLabel = 'Rất phù hợp'
  } else if (totalScore >= 65) {
    tier = 'GOOD'
    tierLabel = 'Phù hợp'
  } else if (totalScore >= 50) {
    tier = 'FAIR'
    tierLabel = 'Tiềm năng'
  }

  let summary = ''
  if (application.aiSummary) {
    summary = application.aiSummary
  } else {
    const matchCountStr = jdTags.length > 0 ? `Đáp ứng ${matchedTags.length}/${jdTags.length} kỹ năng trọng tâm.` : 'Kỹ năng chuyên môn phù hợp.'
    const expStr = experienceScore >= 20 ? `Kinh nghiệm (${candidateExpText}) đáp ứng trọn vẹn yêu cầu.` : `Kinh nghiệm (${candidateExpText}) cần bồi dưỡng thêm.`
    const locStr = locationScore >= 12 ? `Cùng khu vực làm việc (${candidateCity}).` : `Khu vực (${candidateCity}) khác cơ sở tuyển dụng.`
    summary = `Hồ sơ đạt ${totalScore}/100 điểm (${tierLabel}). ${matchCountStr} ${expStr} ${locStr}`
  }

  return {
    score: totalScore,
    tier,
    tierLabel,
    matchedTags,
    missingTags,
    summary,
  }
}
