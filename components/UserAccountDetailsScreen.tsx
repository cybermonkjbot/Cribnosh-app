import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ProfileAvatar } from './ProfileAvatar';
import { VerificationBanner } from './VerificationBanner';
import { useAuthContext } from '@/contexts/AuthContext';

interface UserAccountDetailsScreenProps {
  userName?: string;
  style?: any;
}

// Placeholder SVG icons - replace these with real SVGs
const userIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.9799 17.4899V15.8299C14.9799 15.1696 14.7173 14.5364 14.2504 14.0694C13.8418 13.6609 13.3062 13.4087 12.7363 13.3521L12.4899 13.3399H7.50986C6.84947 13.3399 6.21632 13.6025 5.74936 14.0694C5.28239 14.5364 5.01986 15.1696 5.01986 15.8299L5.01986 17.4899C5.01986 17.9483 4.64826 18.3199 4.18986 18.3199C3.73147 18.3199 3.35986 17.9483 3.35986 17.4899L3.35986 15.8299C3.35986 14.7293 3.79741 13.674 4.57568 12.8957C5.35396 12.1175 6.40922 11.6799 7.50986 11.6799H12.4899L12.6957 11.6848C13.7214 11.7357 14.6944 12.1661 15.4241 12.8957C16.2023 13.674 16.6399 14.7293 16.6399 15.8299V17.4899C16.6399 17.9483 16.2683 18.3199 15.8099 18.3199C15.3515 18.3199 14.9799 17.9483 14.9799 17.4899Z" fill="#707070"/>
<path d="M12.4901 5.82993C12.4901 4.45475 11.3753 3.33993 10.0001 3.33993C8.62487 3.33993 7.5101 4.45475 7.5101 5.82993C7.5101 7.20512 8.62487 8.31993 10.0001 8.31993C11.3753 8.31993 12.4901 7.20512 12.4901 5.82993ZM14.1501 5.82993C14.1501 8.12191 12.2921 9.97993 10.0001 9.97993C7.70812 9.97993 5.8501 8.12191 5.8501 5.82993C5.8501 3.53795 7.70812 1.67993 10.0001 1.67993C12.2921 1.67993 14.1501 3.53795 14.1501 5.82993Z" fill="#707070"/>
</svg>
`;

const shieldIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.8098 5.01963C13.8846 5.01963 11.6354 3.91026 10.0914 2.56286C10.0659 2.54103 10.0334 2.52963 9.99978 2.52963C9.96617 2.52963 9.93372 2.54185 9.90815 2.56368L9.90741 2.56286C8.42038 3.85931 6.25591 4.9495 4.37135 5.01638L4.18979 5.01963L4.18979 10.8297L4.19708 11.1717C4.27098 12.8528 4.89238 14.0989 5.83844 15.068C6.74124 15.9926 7.96882 16.6932 9.38052 17.2403L9.99655 17.4656L10.0152 17.4712C11.6794 16.8905 13.1312 16.1262 14.1612 15.0696C15.1699 14.0346 15.8098 12.6854 15.8098 10.8297V5.01963ZM17.4698 10.8297C17.4698 13.1239 16.6572 14.8877 15.3502 16.2287C14.0658 17.5464 12.3407 18.4197 10.555 19.0421L10.5485 19.0445C10.1932 19.1649 9.80789 19.1606 9.45514 19.034C9.45024 19.0323 9.44543 19.0308 9.44053 19.0292C9.4392 19.0287 9.43771 19.0288 9.43646 19.0283V19.0275C7.65258 18.4096 5.93242 17.5403 4.65098 16.2279C3.42438 14.9715 2.63368 13.3432 2.53951 11.2544L2.52979 10.8297L2.52979 5.01963C2.52988 4.5795 2.70489 4.15718 3.01612 3.84596C3.32741 3.53477 3.74961 3.35963 4.18979 3.35963L4.45646 3.3499C5.81532 3.24987 7.55421 2.41556 8.82284 1.30732L8.83015 1.30165L8.95581 1.20277C9.25959 0.9867 9.62438 0.869629 9.99978 0.869629C10.3752 0.869629 10.74 0.9867 11.0438 1.20277L11.1694 1.30165L11.1767 1.30732L11.4377 1.52698C12.7706 2.60205 14.5048 3.35963 15.8098 3.35963C16.2499 3.35963 16.6722 3.53477 16.9835 3.84596C17.2947 4.15718 17.4697 4.5795 17.4698 5.01963V10.8297Z" fill="#707070"/>
</svg>`;

const lockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.6402 10.845C16.6402 10.3866 16.2686 10.015 15.8102 10.015L4.1902 10.015C3.7318 10.015 3.3602 10.3866 3.3602 10.845L3.3602 16.655C3.3602 17.1134 3.7318 17.485 4.1902 17.485L15.8102 17.485C16.2686 17.485 16.6402 17.1134 16.6402 16.655V10.845ZM18.3002 16.655C18.3002 18.0302 17.1854 19.145 15.8102 19.145L4.1902 19.145C2.81501 19.145 1.7002 18.0302 1.7002 16.655L1.7002 10.845C1.7002 9.46975 2.81501 8.35498 4.1902 8.35498L15.8102 8.35498C17.1854 8.35498 18.3002 9.46975 18.3002 10.845L18.3002 16.655Z" fill="#707070"/>
<path d="M13.32 9.15498V5.83498C13.32 4.95446 12.97 4.11026 12.3473 3.48764C11.7248 2.86502 10.8806 2.51498 10 2.51498C9.11947 2.51498 8.2753 2.86502 7.65268 3.48764C7.03006 4.11026 6.68002 4.95446 6.68002 5.83498L6.68002 9.15498C6.68002 9.61339 6.30841 9.98498 5.85002 9.98498C5.39163 9.98498 5.02002 9.61339 5.02002 9.15498L5.02002 5.83498C5.02002 4.5142 5.54507 3.2479 6.479 2.31396C7.41293 1.38003 8.67924 0.85498 10 0.85498C11.3208 0.85498 12.5871 1.38003 13.521 2.31396C14.455 3.2479 14.98 4.5142 14.98 5.83498V9.15498C14.98 9.61339 14.6084 9.98498 14.15 9.98498C13.6916 9.98498 13.32 9.61339 13.32 9.15498Z" fill="#707070"/>
</svg>`;

const handIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_388_2468)">
<path d="M14.1598 9.15514L14.1598 5.00514C14.1598 4.785 14.0724 4.57396 13.9167 4.4183C13.7805 4.28207 13.6018 4.19802 13.4117 4.17919L13.3298 4.17514C13.1097 4.17514 12.8987 4.26264 12.743 4.4183C12.5873 4.57396 12.4998 4.785 12.4998 5.00514C12.4998 5.46353 12.1283 5.83514 11.6698 5.83514C11.2114 5.83514 10.8398 5.46353 10.8398 5.00514C10.8398 4.34475 11.1024 3.7116 11.5693 3.24463C12.0363 2.77767 12.6695 2.51514 13.3298 2.51514L13.5763 2.5273C14.1461 2.58395 14.6818 2.83611 15.0904 3.24463C15.5573 3.7116 15.8198 4.34475 15.8198 5.00514L15.8198 9.15514C15.8198 9.61355 15.4483 9.98514 14.9898 9.98514C14.5314 9.98514 14.1598 9.61355 14.1598 9.15514Z" fill="#707070"/>
<path d="M10.8298 8.3201L10.8298 3.3401C10.8298 3.11997 10.7423 2.90892 10.5866 2.75326C10.4504 2.61703 10.2717 2.53298 10.0816 2.51415L9.99977 2.5101C9.77965 2.5101 9.56858 2.5976 9.41296 2.75326C9.25725 2.90892 9.16977 3.11997 9.16977 3.3401L9.16977 5.0001C9.16977 5.45849 8.79817 5.8301 8.33977 5.8301C7.88137 5.8301 7.50977 5.45849 7.50977 5.0001V3.3401C7.50977 2.67971 7.77229 2.04656 8.23926 1.57959C8.70621 1.11263 9.33942 0.850098 9.99977 0.850098L10.2462 0.862257C10.8161 0.918913 11.3518 1.17107 11.7603 1.57959C12.2272 2.04656 12.4898 2.67971 12.4898 3.3401L12.4898 8.3201C12.4898 8.77851 12.1182 9.1501 11.6598 9.1501C11.2014 9.1501 10.8298 8.77851 10.8298 8.3201Z" fill="#707070"/>
<path d="M7.49969 8.74502L7.49969 5.01002C7.49969 4.78989 7.41218 4.57884 7.25652 4.42318C7.12029 4.28695 6.94162 4.2029 6.75155 4.18407L6.66969 4.18002C6.44955 4.18002 6.23851 4.26753 6.08285 4.42318C5.92719 4.57884 5.83969 4.78989 5.83969 5.01002L5.83969 11.65C5.83969 12.1084 5.46808 12.48 5.00969 12.48C4.5513 12.48 4.17969 12.1084 4.17969 11.65L4.17969 5.01002C4.17969 4.34963 4.44222 3.71648 4.90918 3.24951C5.37615 2.78255 6.0093 2.52002 6.66969 2.52002L6.9161 2.53218C7.486 2.58883 8.02167 2.84099 8.4302 3.24951C8.89716 3.71648 9.15969 4.34963 9.15969 5.01002L9.15969 8.74502C9.15969 9.20343 8.7881 9.57502 8.32969 9.57502C7.87129 9.57502 7.49969 9.20343 7.49969 8.74502Z" fill="#707070"/>
<path d="M3.21701 9.77838C3.7762 9.76559 4.3209 9.94131 4.76515 10.2736L4.94914 10.4252L4.97751 10.4528L6.43812 11.9134L6.49486 11.9765C6.76078 12.3026 6.74201 12.7831 6.43812 13.087C6.13422 13.3909 5.65366 13.4097 5.32767 13.1438L5.26445 13.087L3.8233 11.6459C3.66688 11.5076 3.46412 11.4329 3.2551 11.4375C3.04209 11.4424 2.83864 11.5295 2.68772 11.6799C2.53695 11.8303 2.44936 12.0328 2.44375 12.2457C2.43824 12.4548 2.51263 12.6577 2.65043 12.8147L5.6138 15.7789C6.69782 16.8556 7.90045 17.4802 10.0013 17.4802H11.6613L11.9499 17.4729C13.3857 17.4016 14.7486 16.8003 15.77 15.7789C16.7915 14.7573 17.3929 13.3941 17.464 11.958L17.4713 11.6702L17.4713 6.6902C17.4713 6.47006 17.3838 6.25902 17.2281 6.10336C17.0725 5.94773 16.8614 5.8602 16.6413 5.8602C16.4212 5.86022 16.2101 5.94773 16.0545 6.10336C15.8989 6.25901 15.8113 6.47009 15.8113 6.6902C15.8113 7.14859 15.4397 7.5202 14.9813 7.5202C14.523 7.52015 14.1513 7.14856 14.1513 6.6902C14.1513 6.02982 14.4138 5.39665 14.8808 4.92969C15.3477 4.46274 15.9809 4.20022 16.6413 4.2002C17.3016 4.2002 17.9348 4.46275 18.4018 4.92969C18.8688 5.39666 19.1313 6.02981 19.1313 6.6902L19.1313 11.6702L19.1224 12.0406C19.0308 13.887 18.257 15.6392 16.9437 16.9526C15.6303 18.2659 13.8781 19.0397 12.0317 19.1313L11.6613 19.1402H10.0013C7.45422 19.1402 5.83434 18.3366 4.44498 16.9565L4.44255 16.955L1.45488 13.9673C1.44496 13.9573 1.4351 13.9469 1.4257 13.9365C0.997347 13.4621 0.767714 12.8408 0.784556 12.2019C0.80141 11.563 1.06371 10.955 1.51648 10.5038C1.96924 10.0527 2.57803 9.79298 3.21701 9.77838Z" fill="#707070"/>
</g>
<defs>
<clipPath id="clip0_388_2468">
<rect width="20" height="20" fill="white"/>
</clipPath>
</defs>
</svg>`;

const houseIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 10L10 3L17 10V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V10Z" fill="#707070"/>
  <rect x="7" y="12" width="6" height="6" fill="#707070"/>
</svg>`;

const briefcaseIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99984 10.0001H10.0082M13.3332 5.00008V3.33341C13.3332 2.89139 13.1576 2.46746 12.845 2.1549C12.5325 1.84234 12.1085 1.66675 11.6665 1.66675H8.33317C7.89114 1.66675 7.46722 1.84234 7.15466 2.1549C6.8421 2.46746 6.6665 2.89139 6.6665 3.33341V5.00008M18.3332 10.8334C15.8605 12.4659 12.9628 13.3362 9.99984 13.3362C7.03688 13.3362 4.13918 12.4659 1.6665 10.8334M3.33317 5.00008H16.6665C17.587 5.00008 18.3332 5.74627 18.3332 6.66675V15.0001C18.3332 15.9206 17.587 16.6667 16.6665 16.6667H3.33317C2.4127 16.6667 1.6665 15.9206 1.6665 15.0001V6.66675C1.6665 5.74627 2.4127 5.00008 3.33317 5.00008Z" stroke="#707070" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const filePenIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.6602 17.4851L11.6602 10.8451L8.34018 10.8451L8.34018 17.4851C8.34018 17.9435 7.96857 18.3151 7.51018 18.3151C7.05178 18.3151 6.68018 17.9435 6.68018 17.4851L6.68018 10.8451C6.68018 10.4048 6.8552 9.98269 7.16651 9.67136C7.47781 9.36011 7.89992 9.18506 8.34018 9.18506L11.6602 9.18506C12.1004 9.18506 12.5225 9.36011 12.8339 9.67136C13.1451 9.98269 13.3202 10.4048 13.3202 10.8451L13.3202 17.4851C13.3202 17.9435 12.9486 18.3151 12.4902 18.3151C12.0318 18.3151 11.6602 17.9435 11.6602 17.4851Z" fill="#707070"/>
<path d="M16.6402 8.33466L16.6353 8.24469C16.6256 8.15509 16.6013 8.06745 16.5632 7.98532C16.5124 7.87582 16.4382 7.77875 16.346 7.70082L16.3419 7.69677L10.536 2.72082C10.4048 2.60998 10.2431 2.54371 10.0732 2.52872L10.0002 2.52548C9.80407 2.52548 9.61425 2.59502 9.46443 2.72163L9.4636 2.72082L3.65848 7.69677L3.65442 7.70082C3.56223 7.77875 3.48801 7.87582 3.43719 7.98532C3.38642 8.09477 3.3602 8.21402 3.3602 8.33466L3.3602 15.8047C3.3602 16.0248 3.4477 16.2366 3.60336 16.3923C3.75899 16.5479 3.97017 16.6347 4.1902 16.6347L15.8102 16.6347C16.0302 16.6347 16.2414 16.5479 16.397 16.3923C16.5527 16.2366 16.6402 16.0248 16.6402 15.8047L16.6402 8.33466ZM18.3002 15.8047C18.3002 16.465 18.0377 17.099 17.5707 17.566C17.1038 18.0328 16.4705 18.2947 15.8102 18.2947L4.1902 18.2947C3.52991 18.2947 2.89663 18.0328 2.42969 17.566C1.96272 17.099 1.7002 16.465 1.7002 15.8047L1.7002 8.33466C1.7002 7.9727 1.77887 7.61498 1.9312 7.28663C2.08363 6.95812 2.3063 6.66691 2.58288 6.43313L8.38883 1.45718L8.3929 1.45393L8.56712 1.31938C8.98519 1.02512 9.48543 0.865479 10.0002 0.865479L10.2198 0.875206C10.6563 0.913851 11.0749 1.06718 11.4333 1.31938L11.6075 1.45393L11.6116 1.45718L17.4175 6.43313L17.5188 6.5231C17.7487 6.73998 17.9358 6.99915 18.0692 7.28663C18.2215 7.61498 18.3002 7.9727 18.3002 8.33466V15.8047Z" fill="#707070"/>
</svg>`;

const heartHandshakeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 5C13.5 3.5 14.74 3 16.5 3C17.9587 3 19.3576 3.57946 20.3891 4.61091C21.4205 5.64236 22 7.04131 22 8.5C22 10.79 20.49 12.54 19 14L12 21L5 14C3.5 12.55 2 10.8 2 8.5C2 7.04131 2.57946 5.64236 3.61091 4.61091C4.64236 3.57946 6.04131 3 7.5 3C9.26 3 10.5 3.5 12 5ZM12 5L9.04 7.96C8.83682 8.16171 8.67556 8.40162 8.56552 8.66593C8.45548 8.93023 8.39882 9.2137 8.39882 9.5C8.39882 9.7863 8.45548 10.0698 8.56552 10.3341C8.67556 10.5984 8.83682 10.8383 9.04 11.04C9.86 11.86 11.17 11.89 12.04 11.11L14.11 9.21C14.6289 8.73919 15.3044 8.47839 16.005 8.47839C16.7056 8.47839 17.3811 8.73919 17.9 9.21L20.86 11.87M18 15L16 13M15 18L13 16" stroke="#707070" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const hopOffIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.82 16.1199C12.51 16.7199 14.73 16.9099 16 16.9699C16.28 16.9799 16.53 16.8799 16.7 16.6999M11.14 20.5699C11.66 20.8099 13.58 21.6899 15.22 21.9399C15.68 21.9999 16.08 21.6899 16.12 21.2299C16.24 19.7099 15.82 17.7999 15.62 16.9499M16.13 21.0499C17.78 21.6799 19.81 21.8899 21 21.9599C21.1285 21.9692 21.2575 21.9508 21.3782 21.9059C21.499 21.861 21.6087 21.7908 21.7 21.6999M17.99 5.51988C19.234 6.87425 20.2932 8.3874 21.14 10.0199C21.1938 10.138 21.218 10.2675 21.2106 10.3971C21.2031 10.5267 21.1643 10.6526 21.0973 10.7638C21.0304 10.875 20.9374 10.9683 20.8264 11.0356C20.7153 11.1028 20.5896 11.1421 20.46 11.1499C19.29 11.2499 17.96 11.1699 16.56 10.8999M20.57 11.1399C20.81 11.6599 21.69 13.5799 21.94 15.2199C21.98 15.5199 21.86 15.8099 21.63 15.9699M4.93 4.92988C3.17718 6.68306 2.13807 9.02482 2.01427 11.5008C1.89047 13.9769 2.69081 16.4106 4.26 18.3299C4.61 18.7599 5.22 18.7299 5.43 18.2099C6.12 16.4999 6.5 13.1399 6.5 11.4999C7.84 11.9499 9.6 12.3999 11.38 12.1199C11.5617 12.0938 11.7301 12.0096 11.86 11.8799M5.52 17.9899C6.57 18.9399 8.43 20.4099 10.02 21.1399C10.1382 21.1937 10.2676 21.2179 10.3972 21.2105C10.5268 21.203 10.6527 21.1642 10.7639 21.0972C10.8752 21.0303 10.9684 20.9373 11.0357 20.8262C11.103 20.7152 11.1422 20.5895 11.15 20.4599C11.35 18.1199 10.82 15.1599 9.58 12.1799M8.35 2.67988C10.004 2.03338 11.8003 1.83898 13.5542 2.11667C15.3082 2.39435 16.9566 3.1341 18.33 4.25988C18.76 4.60988 18.73 5.21988 18.21 5.42988C16.71 6.02988 13.91 6.40988 12.14 6.47988M2 1.99988L22 21.9999" stroke="#707070" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#B0B0B0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Back arrow icon SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const MenuItem = ({ icon, text, onPress }: { icon: string, text: string, onPress?: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemLeft}>
      <View style={styles.iconContainer}>
        <SvgXml xml={icon} width={20} height={20} />
      </View>
      <Text style={styles.menuItemText}>{text}</Text>
    </View>
    <View style={styles.chevronContainer}>
      <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
    </View>
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export function UserAccountDetailsScreen({ 
  userName = "Joshua Anop", 
  style 
}: UserAccountDetailsScreenProps) {
  const router = useRouter();
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | undefined>();
  const { logout } = useAuthContext();
  const handleBackPress = () => {
    router.back();
  };

  const handleProfileImageSelected = (imageUri: string) => {
    setSelectedProfileImage(imageUri);
  };
  const handleLogOut = () => {
    logout();
  }

  return (
    <View style={styles.mainContainer}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <SvgXml xml={backArrowSVG} width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={[styles.container, style]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      {/* Header Section with Avatar and Name */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <ProfileAvatar 
            size={80} 
            onImageSelected={handleProfileImageSelected}
            selectedImageUri={selectedProfileImage}
          />
        </View>
        <Text style={styles.userName}>{userName}</Text>
      </View>
      
      {/* Verification Banner */}
      <View style={styles.bannerContainer}>
        <VerificationBanner 
          text="Finish your verification to help kitchens serve you better"
        />
      </View>
      
      {/* Main Settings Section */}
      <View style={styles.section}>
        <MenuItem icon={userIconSVG} text="Personal info" />
        <MenuItem 
          icon={shieldIconSVG} 
          text="Payments and Family" 
          onPress={() => router.push('/payment-settings')}
        />
        <MenuItem 
          icon={hopOffIconSVG} 
          text="Food safety" 
          onPress={() => router.push('/food-safety')}
        />
        <MenuItem icon={lockIconSVG} text="Login & security" />
        <MenuItem icon={handIconSVG} text="Privacy" />
      </View>
      
      {/* Saved Places Section */}
      <View style={styles.section}>
        <SectionHeader title="Saved places" />
        <MenuItem icon={houseIconSVG} text="Add home address" />
        <MenuItem icon={briefcaseIconSVG} text="Add work address" />
      </View>
      
      {/* Your Data Section */}
      <View style={styles.section}>
        <SectionHeader title="Your Data" />
        <MenuItem 
          icon={filePenIconSVG} 
          text="Download your account data" 
          onPress={() => router.push('/download-account-data')}
        />
        <MenuItem 
          icon={heartHandshakeIconSVG} 
          text="Manage Data Sharing" 
          onPress={() => router.push('/manage-data-sharing')}
        />
      </View>
      
      {/* Support Section */}
      <View style={styles.section}>
        <SectionHeader title="Support" />
        <MenuItem 
          icon={briefcaseIconSVG} 
          text="Help & Support" 
          onPress={() => router.push('/help-support')}
        />
      </View>
      
      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.logOutButton} onPress={handleLogOut}>
          <Text style={styles.logOutText}>Log Out</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteAccountButton}
          onPress={() => router.push('/delete-account')}
        >
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
    minHeight: 1372,
    // Shadow effect
    shadowColor: 'rgba(18, 15, 40, 0.12)',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 620, // Increased padding at the bottom for better scrolling
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#333333',
    textAlign: 'center',
  },
  bannerContainer: {
    marginHorizontal: 16,
    marginBottom: 50,
  },
  section: {
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    marginBottom: 20,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginLeft: 16,
    flex: 1,
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  logOutButton: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  logOutText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
  deleteAccountButton: {
    marginBottom: 20,
  },
  deleteAccountText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 28,
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginRight: 16,
  },
  chevronContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FAFFFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Adjust as needed to center the title
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  modalCancelText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    textAlign: 'center',
  },
  modalLogoutButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FF4444',
  },
  modalLogoutText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
