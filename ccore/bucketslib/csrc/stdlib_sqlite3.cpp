/* Generated by Nim Compiler v0.19.1 */
/*   (c) 2018 Andreas Rumpf */
/* The generated code is subject to the original license. */
#define NIM_NEW_MANGLING_RULES
#define NIM_INTBITS 64

#include "nimbase.h"
#undef LANGUAGE_C
#undef MIPSEB
#undef MIPSEL
#undef PPC
#undef R3000
#undef R4000
#undef i386
#undef linux
#undef mips
#undef near
#undef far
#undef powerpc
#undef unix
struct tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA;
struct TNimType;
struct TNimNode;
struct tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA {
char dummy;
};
typedef NU8 tyEnum_TNimKind_jIBKr1ejBgsfM33Kxw4j7A;
typedef NU8 tySet_tyEnum_TNimTypeFlag_v8QUszD1sWlSIWZz7mC4bQ;
typedef N_NIMCALL_PTR(void, tyProc_ojoeKfW4VYIm36I9cpDTQIg) (void* p, NI op);
typedef N_NIMCALL_PTR(void*, tyProc_WSm2xU5ARYv9aAR4l0z9c9auQ) (void* p);
struct TNimType {
NI size;
tyEnum_TNimKind_jIBKr1ejBgsfM33Kxw4j7A kind;
tySet_tyEnum_TNimTypeFlag_v8QUszD1sWlSIWZz7mC4bQ flags;
TNimType* base;
TNimNode* node;
void* finalizer;
tyProc_ojoeKfW4VYIm36I9cpDTQIg marker;
tyProc_WSm2xU5ARYv9aAR4l0z9c9auQ deepcopy;
};
typedef NU8 tyEnum_TNimNodeKind_unfNsxrcATrufDZmpBq4HQ;
struct TNimNode {
tyEnum_TNimNodeKind_unfNsxrcATrufDZmpBq4HQ kind;
NI offset;
TNimType* typ;
NCSTRING name;
NI len;
TNimNode** sons;
};
TNimType NTI_xRZkbCqVWSKf8kX4o9cbKXA_;
TNimType NTI_Ocaq0E9cAGvTovUG5l30IXg_;
N_LIB_PRIVATE N_NIMCALL(void, stdlib_sqlite3Init000)(void) {
{
	TFrame FR_; FR_.len = 0;
}
}

N_LIB_PRIVATE N_NIMCALL(void, stdlib_sqlite3DatInit000)(void) {
static TNimNode TM_ZpuQ9cIusnUOv1iEoFq9arZw_0[1];
NTI_xRZkbCqVWSKf8kX4o9cbKXA_.size = sizeof(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA);
NTI_xRZkbCqVWSKf8kX4o9cbKXA_.kind = 18;
NTI_xRZkbCqVWSKf8kX4o9cbKXA_.base = 0;
NTI_xRZkbCqVWSKf8kX4o9cbKXA_.flags = 3;
TM_ZpuQ9cIusnUOv1iEoFq9arZw_0[0].len = 0; TM_ZpuQ9cIusnUOv1iEoFq9arZw_0[0].kind = 2;
NTI_xRZkbCqVWSKf8kX4o9cbKXA_.node = &TM_ZpuQ9cIusnUOv1iEoFq9arZw_0[0];
NTI_Ocaq0E9cAGvTovUG5l30IXg_.size = sizeof(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA*);
NTI_Ocaq0E9cAGvTovUG5l30IXg_.kind = 21;
NTI_Ocaq0E9cAGvTovUG5l30IXg_.base = (&NTI_xRZkbCqVWSKf8kX4o9cbKXA_);
NTI_Ocaq0E9cAGvTovUG5l30IXg_.flags = 3;
}

